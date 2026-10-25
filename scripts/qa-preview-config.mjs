/** Validate source and built preview isolation without contacting Cloudflare. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_readRawConfig } from 'wrangler';

const { rawConfig: source } = experimental_readRawConfig({
  config: fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)),
});
const built = JSON.parse(readFileSync(new URL('../dist/server/wrangler.json', import.meta.url), 'utf8'));
for (const [label, config] of [['source', source], ['built', built]]) {
  const preview = config.previews;
  assert.ok(preview, `${label}: explicit preview configuration required`);
  for (const [key, idKey, binding] of [
    ['kv_namespaces', 'id', 'SESSION'],
    ['d1_databases', 'database_id', 'DB'],
  ]) {
    const productionIds = new Set((config[key] || []).map(resource => resource[idKey]).filter(Boolean));
    const resources = preview[key] || [];
    assert.ok(resources.some(resource => resource.binding === binding), `${label}: missing preview ${binding}`);
    for (const resource of resources) {
      assert.ok(resource[idKey], `${label}: preview ${resource.binding} needs an explicit resource ID`);
      assert.ok(!productionIds.has(resource[idKey]), `${label}: preview ${resource.binding} must not share production data`);
    }
  }
  assert.equal((preview.send_email || []).length, 0, `${label}: preview must not send client notifications`);
  assert.equal(preview.images?.binding, 'IMAGES', `${label}: preview image binding required`);
  assert.ok(!preview.routes && !preview.triggers, `${label}: no production routes or schedules in preview`);
}
for (const [key, idKey] of [['kv_namespaces', 'id'], ['d1_databases', 'database_id']]) {
  const resourceIds = config => (config[key] || [])
    .map(resource => [resource.binding, resource[idKey]]).sort();
  assert.deepEqual(resourceIds(built), resourceIds(source), `Build must preserve production ${key}`);
  for (const sourceResource of source.previews[key]) {
    const builtResource = built.previews[key].find(resource => resource.binding === sourceResource.binding);
    assert.equal(builtResource?.[idKey], sourceResource[idKey], `Build must preserve preview ${sourceResource.binding}`);
  }
}
assert.deepEqual(built.send_email || [], source.send_email || [], 'Build must preserve production email bindings');
console.log('PASS source and built previews use separate SESSION/DB resources, Images and no email binding');
