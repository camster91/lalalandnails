import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { pricingDraft, displayPrice } from '../src/data/pricing.ts';
import { siteConfig } from '../src/data/site.ts';

const readSource = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('draft pricing does not accidentally become a published, verified business fact', () => {
  assert.equal(pricingDraft.approved, false);
  assert.equal(siteConfig.services[0].priceDisplay, null);
  assert.equal(siteConfig.launchReady, false);
  assert.match(readSource('src/pages/services-pricing.astro'), /pricing-proposal/);
  assert.match(readSource('src/pages/services-pricing.astro'), /!import\.meta\.env\.DEV && !prices\.approved/);
  for (const path of ['src/pages/index.astro','src/components/Header.astro','src/components/Footer.astro','src/components/BookingRequest.astro']) {
    assert.match(readSource(path), /import\.meta\.env\.DEV \|\| pricingDraft\.approved|const showPricing = import\.meta\.env\.DEV \|\| pricingDraft\.approved/, path);
  }
  assert.match(readSource('src/components/PricingTeaser.astro'), /Proposed starting prices/);
});

test('all price amounts are finite, positive, and unique by catalogue name', () => {
  const all = [
    ...pricingDraft.manicures,
    ...pricingDraft.fills,
    ...pricingDraft.repairs,
    pricingDraft.standaloneRemoval,
  ];
  assert.equal(new Set(all.map((item) => item.name)).size, all.length);
  for (const entry of all) {
    assert.equal(Number.isSafeInteger(entry.price), true, entry.name);
    assert.ok(entry.price > 0 && entry.price <= 500, entry.name);
    assert.equal(displayPrice(entry.price), '$' + entry.price);
  }
});

test('length guide and tier prices follow a simple increasing model', () => {
  const { lengths, artTiers, shapes } = pricingDraft;
  assert.deepEqual(lengths.map((item) => item.name), ['Short', 'Medium', 'Long', 'Extra long']);
  assert.deepEqual(lengths.map((item) => item.addOn), [0, 10, 20, null]);
  assert.deepEqual(artTiers.map((item) => item.addOn), [10, 20, 35, 50]);
  assert.ok(artTiers.every((item) => item.name && item.detail));
  assert.ok(shapes.includes('Almond') && shapes.includes('Squoval'));
  assert.equal(new Set(shapes).size, shapes.length);
});

test('new structured-gel examples and fill add-ons have internally consistent arithmetic', () => {
  const structured = pricingDraft.manicures.find((item) => item.id === 'structured');
  assert.ok(structured);
  assert.equal(structured.price, 75);
  assert.equal(structured.price + pricingDraft.lengths[1].addOn + pricingDraft.artTiers[1].addOn, 105);
  assert.deepEqual(pricingDraft.fills.filter((item) => item.name.includes('structured gel fill')).map((item) => item.price), [70, 80, 90]);
  for (const [index, fill] of pricingDraft.fills.slice(0, 3).entries()) {
    assert.equal(fill.price, structured.price + pricingDraft.lengths[index].addOn - 5, fill.name);
  }
});

test('the prices and CTAs appear in the intended page locations', () => {
  const index = readSource('src/pages/index.astro');
  const page = readSource('src/pages/services-pricing.astro');
  const header = readSource('src/components/Header.astro');
  const footer = readSource('src/components/Footer.astro');
  const booking = readSource('src/components/BookingRequest.astro');
  const components = ['manicures', 'fills', 'length', 'art', 'repairs', 'pricing-example'];
  for (const id of components) assert.ok(page.includes('id="' + id + '"'), id);
  assert.ok(index.indexOf('<PricingTeaser />') < index.indexOf('<VisitGuide />'), 'pricing preview precedes visit guide');
  assert.match(index, /pricingDraft\.approved\) && <PricingTeaser \/>/, 'preview is approval-gated');
  assert.match(header, /href="\/services-pricing"/);
  assert.match(footer, /href="\/services-pricing"/);
  assert.match(booking, /href="\/services-pricing"/);
  assert.match(page, /href="\/#booking"/);
  assert.match(page, /AI-generated inspiration/);
  assert.ok(!page.includes('priceRange') && !page.includes('aggregateRating'));
});

test('pricing page and booking packages share stable catalogue IDs and amounts',async()=>{
 const {bookingPackages,reconstructionTiers,repairOptions}=await import('../src/lib/booking-options.ts');
 const catalogue=[...pricingDraft.manicures,...pricingDraft.fills,pricingDraft.naturalMaintenance];
 for(const service of catalogue)assert.equal(bookingPackages.find(p=>p.id===service.id)?.price,service.price,service.id);
 assert.strictEqual(reconstructionTiers,pricingDraft.reconstructionTiers);assert.strictEqual(repairOptions,pricingDraft.repairs);
 assert.equal(pricingDraft.naturalMaintenance.price,45);assert.deepEqual(reconstructionTiers.map(t=>t.price),[10,20,35,50]);
 const page=readSource('src/pages/services-pricing.astro');assert.match(page,/prices\.reconstructionTiers\.map/);assert.match(page,/prices\.naturalMaintenance/);
});
