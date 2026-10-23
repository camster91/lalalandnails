import assert from 'node:assert/strict';
import test from 'node:test';
import { siteConfig } from '../src/data/site.ts';
import { buildRobots, buildSchema, isIndexable, serializeSchema } from '../src/lib/seo.ts';

test('the public homepage is indexable independently of the full marketing checklist', () => {
  assert.equal(siteConfig.launchReady, false);
  assert.equal(isIndexable(siteConfig, new URL('https://lalalandnails.ca/?utm_source=instagram')), true);
});

test('previews, noncanonical hosts and private or missing pages stay noindex', () => {
  for (const url of [
    'https://lalalandnails.camster915391.workers.dev/',
    'http://localhost:4321/', 'https://www.lalalandnails.ca/',
    'https://lalalandnails.ca/admin', 'https://lalalandnails.ca/missing',
  ]) assert.equal(isIndexable(siteConfig, new URL(url)), false, url);
});

test('indexing can be explicitly disabled without breaking the site', () => {
  const site = { ...siteConfig, indexingEnabled: false };
  assert.equal(isIndexable(site, new URL('https://lalalandnails.ca/')), false);
  assert.equal(buildRobots(site, new URL('https://lalalandnails.ca/robots.txt')), 'User-agent: *\nDisallow: /\n');
});

test('canonical robots allow discovery, protect private routes and identify the sitemap', () => {
  const robots = buildRobots(siteConfig, new URL('https://lalalandnails.ca/robots.txt'));
  assert.match(robots, /Allow: \/\n/);
  assert.match(robots, /Disallow: \/admin\n/);
  assert.match(robots, /Disallow: \/api\/\n/);
  assert.match(robots, /Sitemap: https:\/\/lalalandnails.ca\/sitemap.xml/);
  assert.equal(buildRobots(siteConfig, new URL('https://lalalandnails.camster915391.workers.dev/robots.txt')), 'User-agent: *\nDisallow: /\n');
});

test('schema answers match every visible FAQ without invented commercial claims', () => {
  const schema = buildSchema(siteConfig);
  const faq = schema['@graph'].find((node) => node['@type'] === 'FAQPage');
  assert.deepEqual(faq.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]), siteConfig.faqs.map((item) => [item.question, item.answer]));
  const json = JSON.stringify(schema);
  for (const field of ['aggregateRating', 'reviewRating', 'priceRange', 'openingHoursSpecification', 'streetAddress', 'postalCode']) {
    assert.equal(json.includes(`"${field}"`), false, field);
  }
});

test('all schema entity references resolve within the canonical graph', () => {
  const schema = buildSchema(siteConfig);
  const ids = new Set(schema['@graph'].map((node) => node['@id']));
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if ('@id' in value) assert.ok(ids.has(value['@id']), value['@id']);
    Object.values(value).forEach(visit);
  };
  visit(schema);
});

test('structured-data serialization cannot close its containing script', () => {
  const input = { text: '</script><script>alert(1)</script>' };
  const output = serializeSchema(input);
  assert.equal(output.includes('<'), false);
  assert.deepEqual(JSON.parse(output), input);
});
