import assert from 'node:assert/strict';
import test from 'node:test';
import { generateKeyPair, SignJWT, createLocalJWKSet, exportJWK } from 'jose';
import { parseAccessSettings, verifyStaffRequest } from '../src/lib/staff-access.ts';
import { parseLeadFilters, parseLeadUpdate, torontoDate } from '../src/lib/crm.ts';

const settings = parseAccessSettings({ ACCESS_TEAM_DOMAIN: 'test-team.cloudflareaccess.com', ACCESS_AUD: 'test-audience', CRM_ADMIN_EMAILS: 'bianca@example.com' });
const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
const keys = createLocalJWKSet({ keys: [{ ...jwk, kid: 'test', alg: 'RS256' }] });
const token = (overrides = {}) => new SignJWT({ email: 'bianca@example.com', ...overrides }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setIssuer('https://test-team.cloudflareaccess.com').setAudience(overrides.aud ?? 'test-audience').setSubject('staff-1').setIssuedAt().setExpirationTime('5m').sign(privateKey);

test('staff config must include a genuine Access team host, audience and allowlist', () => {
  assert.equal(parseAccessSettings({}), null);
  assert.equal(parseAccessSettings({ ACCESS_TEAM_DOMAIN: 'attacker.example.com', ACCESS_AUD: 'x', CRM_ADMIN_EMAILS: 'a@example.com' }), null);
  assert.ok(settings);
});

test('forged legacy identity headers never authenticate a staff member', async () => {
  const request = new Request('https://lalalandnails.ca/admin', { headers: { 'oai-authenticated-user-id': '13b3ce1c-2ea9-47f2-bb97-25d24cb2ab77', 'oai-authenticated-user-email': 'bianca@example.com' } });
  assert.equal(await verifyStaffRequest(request, settings, keys), null);
});

test('a signed, unexpired Access token for an allowed staff email authenticates', async () => {
  const request = new Request('https://lalalandnails.ca/admin', { headers: { 'Cf-Access-Jwt-Assertion': await token() } });
  assert.deepEqual(await verifyStaffRequest(request, settings, keys), { userId: 'staff-1', email: 'bianca@example.com', fullName: null });
});

test('bad signatures, audience, issuer, expiry and nonstaff identities are denied', async () => {
  const tokens = [await token({ email: 'someone@example.com' }), await token({ aud: 'wrong' }), 'not-a-jwt'];
  const parts = (await token()).split('.');
  parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1);
  tokens.push(parts.join('.'));
  tokens.push(await new SignJWT({ email: 'bianca@example.com' }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setIssuer('https://wrong.cloudflareaccess.com').setAudience('test-audience').setSubject('x').setIssuedAt().setExpirationTime('5m').sign(privateKey));
  tokens.push(await new SignJWT({ email: 'bianca@example.com' }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setIssuer(settings.issuer).setAudience(settings.audience).setSubject('x').setIssuedAt(1).setExpirationTime(2).sign(privateKey));
  for(const jwt of tokens) assert.equal(await verifyStaffRequest(new Request('https://lalalandnails.ca/admin', { headers: { 'Cf-Access-Jwt-Assertion': jwt } }), settings, keys), null);
});

test('lead filters reject invalid status or unbounded pagination', () => {
  assert.equal(parseLeadFilters(new URL('https://x/?page=-1')), null);
  assert.equal(parseLeadFilters(new URL('https://x/?status=unknown')), null);
  assert.equal(parseLeadFilters(new URL('https://x/?page=1.5')), null);
  assert.equal(parseLeadFilters(new URL('https://x/?q=Bianca&view=archived&page=2')).q, 'Bianca');
});

test('updates require a version, reject permanent deletion and validate calendar dates', () => {
  assert.equal(parseLeadUpdate({ action: 'delete', updatedAt: '123' }), null);
  assert.equal(parseLeadUpdate({ action: 'update', status: 'contacted', updatedAt: '123', followUpDate: '2026-02-30' }), null);
  assert.equal(parseLeadUpdate({ action: 'update', status: 'contacted', followUpDate: '' }), null);
  assert.deepEqual(parseLeadUpdate({ action: 'update', status: 'contacted', updatedAt: '123', adminNote: 'Call back', followUpDate: '2026-10-27' }), { action: 'update', status: 'contacted', updatedAt: 123, adminNote: 'Call back', followUpDate: '2026-10-27' });
  assert.deepEqual(parseLeadUpdate({ action: 'restore', updatedAt: '123' }), { action: 'restore', updatedAt: 123 });
});

test('follow-up today uses Toronto rather than UTC midnight', () => {
  assert.equal(torontoDate(new Date('2026-10-24T02:00:00Z')), '2026-10-23');
});
