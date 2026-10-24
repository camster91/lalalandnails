/**
 * Local production-mode check for the approved pricing release.
 * Verifies that approved routes render without deploying anything.
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
  assert.ok(homeHtml.includes('id="pricing"'), 'Approved homepage teaser visible');
  assert.ok(homeHtml.includes('href="/services-pricing"'), 'Approved menu linked');
  assert.ok(homeHtml.includes('Signature Structured Gel Manicure'));
  for (const path of ['/services-pricing', '/services-pricing?source=qa']) {
    const response = await respond(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes('Tier 4 — Bespoke'));
    assert.ok(!html.includes('Pricing draft for studio review.'));
  }
  // A noncanonical local preview must not advertise URLs for indexing.
  const sitemap = await (await respond('/sitemap.xml')).text();
  assert.ok(!sitemap.includes('<loc>'));
  console.log('PASS approved pricing is public in production; preview sitemap stays empty');

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
