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
