/** Local-only rendered regression: fabricated staff data, every API intercepted. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { demoSnapshot } from '../src/scripts/studio-demo.ts';

const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4321';
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname),
  'Studio fixture checks must run against a local development server');
const browser = await chromium.launch({ headless: true,
  ...(process.env.QA_CHROME_PATH ? { executablePath: process.env.QA_CHROME_PATH } : {}) });
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [], writes = [];
    let enabled = false;
    page.on('pageerror', error => errors.push(error.message));
    // Use the existing DEV-only template to exercise the real staff client script.
    // Production authentication and application source are not bypassed or altered.
    await page.route('**/studio-preview', async route => {
      const response = await route.fetch();
      const html = await response.text();
      assert.ok(html.includes('data-demo="true"'), 'Requires the existing development demo');
      await route.fulfill({ response, body: html.replace('data-demo="true"', 'data-demo="false"') });
    });
    await page.route('**/api/**', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.pathname === '/api/admin/studio' && request.method() === 'GET') {
        return route.fulfill({ json: demoSnapshot() });
      }
      if (url.pathname === '/api/admin/bookings' && request.method() === 'GET') {
        return route.fulfill({ json: { records: [], total: 0 } });
      }
      if (url.pathname === '/api/admin/calendar-feed') {
        const action = url.searchParams.get('action');
        if (request.method() === 'POST' && ['rotate', 'disable'].includes(action)) {
          writes.push(action);
          enabled = action === 'rotate';
        } else assert.equal(request.method(), 'GET', 'Only expected fixture actions allowed');
        return route.fulfill({ json: { enabled,
          ...(action === 'rotate' ? { url: 'https://example.invalid/calendar/fabricated-token.ics' } : {}) } });
      }
      await route.abort();
      errors.push('Unexpected API blocked: ' + request.method() + ' ' + url.pathname);
    });
    await page.goto(origin + '/studio-preview#settings');
    await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
    const opener = page.locator('[data-open="calendar-feed"]');
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('#studio-dialog');
    await dialog.waitFor({ state: 'visible' });
    for (const action of ['rotate', 'rotate', 'disable']) {
      await page.locator(`[data-open="feed-${action}"]`).focus();
      await page.keyboard.press('Enter');
      if (action === 'rotate') await page.locator('#feed-url').waitFor();
      else await page.locator('#feed-url').waitFor({ state: 'detached' });
      // Wait for the mocked action and refreshed markup, including replacement links.
      await page.waitForFunction(() => document.activeElement?.matches('#studio-dialog [data-close]'), null, { timeout: 5000 });
      assert.ok(await dialog.evaluate(node => node.contains(document.activeElement)), 'Focus remains in refreshed dialog');
      const geometry = await dialog.evaluate(node => ({ left: node.getBoundingClientRect().left,
        right: node.getBoundingClientRect().right, width: innerWidth }));
      assert.ok(geometry.left >= -1 && geometry.right <= geometry.width + 1, 'Dialog fits viewport');
    }
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(v => v.id), [], 'No automated dialog accessibility violations');
    await page.keyboard.press('Escape');
    assert.equal(await dialog.evaluate(node => node.open), false);
    assert.ok(await opener.evaluate(node => node === document.activeElement), 'Escape restores opener focus');
    assert.deepEqual(writes, ['rotate', 'rotate', 'disable']);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, dialogFocus: 'pass', keyboard: 'pass', accessibility: 'pass', mockedActions: writes }));
    await context.close();
  }
} finally { await browser.close(); }
