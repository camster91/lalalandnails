/**
 * Local production-mode safety check for proposed, unapproved prices.
 * Verifies that production routes fail closed without deploying anything.
 * Requires npm run build to have completed. No remote Workers, D1, KV,
 * email bindings or production account changes.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const baseUrl = 'http://127.0.0.1:4387';
const child = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4387'], {
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
  detached: process.platform !== 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
for (const stream of [child.stdout, child.stderr]) {
  stream.on('data', (bytes) => {
    output = (output + bytes.toString()).slice(-12000);
  });
}
const respond = (path) => fetch(baseUrl + path, { signal: AbortSignal.timeout(4500), redirect: 'manual' });

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw Error('Local production preview exited early: ' + output);
    try {
      const response = await respond('/');
      if (response.ok) { ready = true; break; }
    } catch { /* Starting local runtime */ }
    await delay(500);
  }
  assert.ok(ready, 'Could not start local production preview: ' + output);

  const homepage = await respond('/');
  assert.equal(homepage.status, 200, 'Public homepage should stay accessible');
  const homeHtml = await homepage.text();
  assert.ok(homeHtml.includes('La La Land Nail Hub') || homeHtml.includes('La La Land'));
  assert.ok(!homeHtml.includes('Services &amp; Pricing'), 'Unapproved price nav must be hidden');
  assert.ok(!homeHtml.includes('Services & Pricing'), 'Unapproved price nav must be hidden');
  assert.ok(!homeHtml.includes('id="pricing"'), 'Unapproved homepage teaser must be hidden');
  assert.ok(!homeHtml.includes('href="/services-pricing"'), 'No public links to draft route');
  assert.ok(!homeHtml.includes('Signature Structured Gel Manicure'), 'Proposed offer hidden');
  console.log('PASS production homepage remains public with all draft pricing links/teaser hidden');

  for (const path of ['/services-pricing', '/services-pricing?source=qa']) {
    const response = await respond(path);
    assert.equal(response.status, 404, 'Draft route should return HTTP 404 in production mode: ' + path);
    const html = await response.text();
    assert.ok(!html.includes('Tier 4 — Bespoke'), 'Draft art prices not leaked in body');
    assert.ok(!html.includes('pricing-proposal'), 'Draft content not leaked in body');
    console.log('PASS production draft route blocked', path);
  }

  const sitemap = await respond('/sitemap.xml');
  assert.equal(sitemap.status, 200, 'Sitemap remains accessible');
  const sitemapXml = await sitemap.text();
  assert.ok(!sitemapXml.includes('/services-pricing'), 'Draft route should not be in sitemap');
  console.log('PASS sitemap excludes draft pricing route');

  console.log('PASS production safety smoke test completed without making remote requests');
} finally {
  if (child.pid) {
    try {
      if (process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM');
      else child.kill('SIGTERM');
    } catch { /* already exited */ }
  }
  child.stdout?.destroy();
  child.stderr?.destroy();
  child.unref();
}
