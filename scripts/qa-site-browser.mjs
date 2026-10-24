/** Existing-site QA. Run against localhost by default or QA_ORIGIN for read-only live checks.
 * Every API request is intercepted; no real availability, bookings or notifications are touched.
 * npm install --no-save --package-lock=false playwright @axe-core/playwright
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pricingDraft } from '../src/data/pricing.ts';
import { quoteBooking, formatBookingEstimate } from '../src/lib/booking-options.ts';

const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4321';
const label = new URL(origin).hostname === 'lalalandnails.ca' ? 'live' : 'local';
const directory = `qa-artifacts/${label}`;
mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.QA_CHROME_PATH ? { executablePath: process.env.QA_CHROME_PATH } : {}) });
const results = [];
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [], violations = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname === '/api/availability' && route.request().method() === 'GET') {
        const month = new URL(route.request().url()).searchParams.get('month');
        const count = new Date(`${month}-01T12:00Z`);
        count.setUTCMonth(count.getUTCMonth() + 1, 0);
        const days = Array.from({ length: count.getUTCDate() }, (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, '0')}`;
          return { date, times: [0, 6].includes(new Date(date + 'T12:00Z').getUTCDay()) ? [] : ['10:00', '11:00', '12:00', '13:00'] };
        });
        await route.fulfill({ json: { month, days, today: `${month}-01`, lastDate: `${month}-28` } });
      } else {
        throw Error('Unexpected API request blocked: ' + route.request().method() + ' ' + new URL(route.request().url()).pathname);
      }
    });
    for (const path of ['/', '/services-pricing', '/privacy', '/missing-qa-page']) {
      const response = await page.goto(origin + path, { waitUntil: 'networkidle' });
      assert.equal(response.status(), path === '/missing-qa-page' ? 404 : 200);
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
      assert.equal(await page.locator('main h1').count(), 1, `${path}: one H1`);
      assert.ok(await page.title(), `${path}: page title`);
      assert.ok(await page.locator('meta[name="description"]').getAttribute('content'));
      // Full-page screenshots do not scroll lazy images into view by themselves.
      await page.locator('img').evaluateAll(async images => {
        images.forEach(image => { image.loading = 'eager'; });
        await Promise.all(images.map(image => image.decode()));
      });
      const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
      assert.ok(geometry.document <= width + 2, `${path} ${width}: overflow ${JSON.stringify(geometry)}`);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      violations.push(...axe.violations.map(v => ({ path, id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })));
      await page.screenshot({ path: `${directory}/${path === '/' ? 'home' : path.slice(1)}-${width}.png`, fullPage: true, animations: 'disabled' });
      if (path === '/services-pricing') {
        for (const length of pricingDraft.lengths.filter(l => l.addOn !== null)) {
          for (const [index, tier] of pricingDraft.artTiers.entries()) {
            await page.locator('[data-estimate-length]').selectOption(String(length.addOn));
            await page.locator('[data-estimate-art]').selectOption(String(tier.addOn));
            const quote = quoteBooking({ package: 'structured', length: length.name.toLowerCase(), art: String(index + 1) });
            assert.equal(await page.locator('[data-estimate-total]').textContent(), `$${quote.total}${'startingAt' in tier ? '+' : ''}`);
          }
        }
      }
    }
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
    await page.keyboard.press('Enter');
    if (width <= 900) {
      await page.locator('.menu-toggle').click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator(':focus').getAttribute('class'), 'menu-toggle');
      await page.locator('.menu-toggle').click();
      await page.locator('.site-nav a[href="#service"]').click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('.site-nav').evaluate(nav => nav.contains(document.activeElement)), false, 'Closed mobile menu must not retain keyboard focus');
    }
    await page.locator('.hero a[href="#booking"]').first().click();
    const dialog = page.locator('[data-booking-dialog]');
    await dialog.waitFor({ state: 'visible' });
    await dialog.locator('[data-calendar-days] button:not([disabled])').first().click();
    await dialog.locator('[name="preferredTime"]').selectOption('10:00');
    await dialog.locator('[data-calendar-use]').click();
    const form = dialog.locator('form');
    await form.locator('[name="package"]').selectOption('structured');
    await form.locator('[name="length"]').selectOption('medium');
    await form.locator('[name="art"]').selectOption('2');
    const expected = quoteBooking({ package: 'structured', length: 'medium', art: '2' });
    assert.equal(await form.locator('[data-booking-estimate]').textContent(), formatBookingEstimate(expected));
    await form.locator('[data-step-next="2"]').click();
    assert.match(await form.locator('[data-booking-review]').textContent(), /\$105\.00 CAD/);
    await form.locator('button[type="submit"]').click(); // Empty details: client-side validation only.
    assert.equal(await form.locator('[name="name"]').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator(':focus').getAttribute('name'), 'name');
    await form.locator('[data-step-back="1"]').click();
    await form.locator('[name="package"]').selectOption('unsure');
    assert.match(await form.locator('[data-booking-estimate]').textContent(), /help you choose/);
    await form.locator('[data-step-next="2"]').click();
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    violations.push(...axe.violations.map(v => ({ path: 'booking-dialog', id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })));
    await page.screenshot({ path: `${directory}/booking-${width}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(), false);
    assert.deepEqual(errors, [], `${width}: script errors`);
    results.push({ width, errors, violations });
    console.log(JSON.stringify(results.at(-1)));
    await context.close();
  }
} finally {
  writeFileSync(`${directory}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
assert.deepEqual(results.flatMap(result => result.violations), [], 'Accessibility violations require review');
