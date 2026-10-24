import assert from 'node:assert/strict';
import test from 'node:test';
import { siteConfig } from '../src/data/site.ts';

test('the public domain can be used as a base for canonical and social URLs', () => {
  const origin = siteConfig.approvedDomain ?? siteConfig.canonicalOrigin;
  assert.equal(new URL(origin).protocol, 'https:');
  assert.equal(new URL('/booking?source=homepage', origin).href,
    'https://lalalandnails.ca/booking?source=homepage');
  assert.equal(new URL('/images/generated/red-1440.webp', origin).hostname,
    'lalalandnails.ca');
});

test('existing site describes its services and the three-step request accurately', () => {
  assert.match(siteConfig.specialty, /Russian-style.*structured gel/);
  assert.match(siteConfig.services[0].description, /dry manicures/);
  assert.equal(siteConfig.services[0].priceDisplay?.startsWith('From $'), true);
  assert.ok(siteConfig.services[0].inclusions.length >= 2);
  assert.equal(siteConfig.process.length, 3);
  assert.match(siteConfig.process[1].description, /manicure|nail-art|service/);
  assert.match(siteConfig.process[2].description, /inspiration/);
  assert.ok(siteConfig.policies.some((note) => /confirm/i.test(note)));
  const faqTitles = siteConfig.faqs.map((faq) => faq.question.toLowerCase()).join(' ');
  for (const topic of ['structured gel', 'fill', 'broken nail', 'HEMA-free', 'nail art']) {
    assert.ok(faqTitles.includes(topic.toLowerCase()), topic);
  }
  assert.equal(siteConfig.location.streetAddress, null);
});
