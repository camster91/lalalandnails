import test from 'node:test';
import assert from 'node:assert/strict';
import {detectLeadSource,leadSource} from '../src/lib/lead-source.ts';
test('attribution retains known channels but no arbitrary query or referrer data',()=>{
 const base='https://lalalandnails.ca/';
 assert.equal(detectLeadSource(base+'?utm_source=instagram&utm_campaign=private@example.com',''),'instagram');
 assert.equal(detectLeadSource(base,'https://www.google.ca/search?q=private'),'google');
 assert.equal(detectLeadSource(base,'https://instagram.com.evil.example/private'),'referral');
 assert.equal(detectLeadSource(base,''),'direct');
 assert.equal(leadSource('private@example.com'),'unknown');
 assert.equal(detectLeadSource(base,'https://google.evil.example/private'),'referral');
});
