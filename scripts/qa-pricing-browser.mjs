/**
 * Draft pricing browser smoke/visual-geometry checks.
 * Run: npm install --no-save --package-lock=false playwright
 *      npx playwright install chromium
 *      node scripts/qa-pricing-browser.mjs
 *
 * Opens only the local Astro development server. No production requests,
 * database modifications, emails or appointment submissions are performed.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const origin = 'http://127.0.0.1:4321';
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4321'], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLogs = '';
for (const stream of [server.stdout, server.stderr]) {
  stream.on('data', chunk => { serverLogs = (serverLogs + chunk.toString()).slice(-8000); });
}
let browser;
const viewports = [
  { name: 'small-phone', width: 320, height: 700 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'small-desktop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(origin + '/services-pricing', { signal: AbortSignal.timeout(3000) });
      if (response.ok) { ready = true; break; }
    } catch { /* still starting */ }
    await delay(650);
  }
  assert.ok(ready, 'Local Astro route did not start: ' + serverLogs);

  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const size of viewports) {
    const page = await browser.newPage({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    const response = await page.goto(origin + '/services-pricing', { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200, size.name + ': pricing page HTTP status');
    await page.evaluate(() => document.fonts?.ready);
    assert.equal(await page.locator('h1').count(), 1, size.name + ': one page heading');
    for (const section of ['manicures', 'fills', 'length', 'art', 'repairs', 'pricing-example']) {
      assert.equal(await page.locator('#' + section).count(), 1, size.name + ': missing section ' + section);
    }
    assert.equal(await page.locator('.pricing-length svg').count(), 4, size.name + ': 4 length visuals');
    assert.equal(await page.locator('.pricing-art-card svg').count(), 4, size.name + ': 4 art tiers');

    const layout = await page.evaluate(() => {
      const select = [
        '.pricing-card', '.pricing-length', '.pricing-art-card',
        '.pricing-list__item', '.pricing-example__receipt', '.pricing-cta',
      ];
      const failures = [];
      for (const element of document.querySelectorAll(select.join(','))) {
        const box = element.getBoundingClientRect();
        if (box.left < -2 || box.right > innerWidth + 2) {
          failures.push({ element: element.className, left: box.left, right: box.right });
        }
      }
      return {
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        visibleErrors: failures,
      };
    });
    assert.deepEqual(layout.visibleErrors, [], size.name + ': elements overflow viewport');
    assert.ok(layout.documentWidth <= size.width + 2, size.name + ': document width overflow ' + JSON.stringify(layout));
    assert.deepEqual(errors, [], size.name + ': browser script errors');

    const artLink = page.locator('.pricing-index a[href="#art"]');
    await artLink.click();
    assert.equal(new URL(page.url()).hash, '#art', size.name + ': art anchor');
    assert.equal(await page.locator('a[href="/#booking"]').count() >= 1, true, size.name + ': pricing CTA exists');

    if (size.width <= 900) {
      const menu = page.locator('.menu-toggle');
      await menu.click();
      assert.equal(await menu.getAttribute('aria-expanded'), 'true', size.name + ': menu opens');
      await page.locator('.site-nav a[href="/services-pricing"]').waitFor({ state: 'visible', timeout: 3000 });
      assert.equal(await page.locator('.site-nav a[href="/services-pricing"]').isVisible(), true, size.name + ': pricing link in menu');
      const navScrollable = await page.locator('.site-nav').evaluate(el =>
        ({ height: el.clientHeight, scrollHeight: el.scrollHeight, overflowY: getComputedStyle(el).overflowY })
      );
      assert.ok(navScrollable.overflowY === 'auto', size.name + ': menu scroll enabled');
      await menu.click();
      assert.equal(await menu.getAttribute('aria-expanded'), 'false', size.name + ': menu closes');
    }

    console.log('PASS', size.name, size.width + 'x' + size.height, 'section/visual/navigation/overflow checks');
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(origin + '/');
  assert.equal(await page.locator('#pricing').count(), 1, 'homepage teaser exists');
  const order = await page.evaluate(() => {
    const teaser = document.querySelector('#pricing');
    const visit = document.querySelector('.visit-guide');
    return Boolean(teaser && visit && (teaser.compareDocumentPosition(visit) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  assert.ok(order, 'homepage pricing teaser follows signature service and precedes visit guide');
  await page.locator('#pricing a[href="/services-pricing"]').click();
  assert.equal(new URL(page.url()).pathname, '/services-pricing');
  await page.locator('.pricing-cta a[href="/#booking"]').click();
  assert.equal(new URL(page.url()).pathname, '/');
  assert.equal(new URL(page.url()).hash, '#booking');
  assert.equal(await page.locator('form[data-booking-form]').count(), 1, 'the booking form remains singular');
  console.log('PASS homepage pricing preview → price page → request form journey');
  await page.close();
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
