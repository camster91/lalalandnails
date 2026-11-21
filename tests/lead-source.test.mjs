import test from 'node:test';
import assert from 'node:assert/strict';
import {detectLeadSource,leadSource} from '../src/lib/lead-source.ts';
test('attribution retains known channels but no arbitrary query or referrer data',()=>{
 const base='https://lalalandnails.ca/';
 assert.equal(detectLeadSource(base+'?utm_source=instagram&utm_campaign=private@example.com',''),'instagram');
 assert.equal(detectLeadSource(base,'https://www.google.ca/search?q=private'),'google');
 assert.equal(detectLeadSource(base,'https://instagram.com.evil.example/private'),'referral');
 assert.equal(detectLeadSource(base,''),'direct');
 assert.equal(leadSource('private@example.com'),'unknown');
 assert.equal(detectLeadSource(base,'https://google.evil.example/private'),'referral');
});

test('a Google guide visit retains its channel through pricing and booking', async () => {
  const {visitSource} = await import('../src/lib/lead-source.ts');
  const home = 'https://lalalandnails.ca/';
  const guide = home + 'services/nail-art-scarborough';
  const pricing = home + 'services-pricing';
  const first = visitSource(guide, 'https://www.google.ca/', null);
  assert.equal(visitSource(home, pricing, visitSource(pricing, guide, first)), 'google');
  assert.equal(visitSource(home + '?utm_source=pinterest', guide, first), 'pinterest');
  assert.equal(visitSource(home, '', first), 'direct');
  assert.equal(visitSource(home, 'https://www.bing.com/', first), 'bing');
});

test('Google campaign markers survive navigation without reclassifying untagged referrals', async () => {
  const {visitSource} = await import('../src/lib/lead-source.ts');
  const home = 'https://lalalandnails.ca/';
  for (const query of ['?gclid=example','?gbraid=example','?wbraid=example','?utm_source=Google&utm_medium=CPC']) {
    assert.equal(visitSource(home + query,home,'direct'),'google-paid');
  }
  assert.equal(visitSource(home,home+'services-pricing','google-paid'),'google-paid');
  assert.equal(visitSource(home+'?utm_source=google&utm_medium=organic','',''),'google-organic');
  assert.equal(visitSource(home,'https://www.google.ca/',''),'google');
});
