import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { normalizePhone, recentPhoneSql } from '../src/lib/phone.ts';
import { phoneKey } from '../src/lib/studio-validation.ts';
test('public and CRM phone identities agree and reject invalid or unsupported numbers',()=>{
 for(const value of ['4165550123','(416) 555-0123','+1 416.555.0123']) assert.equal(normalizePhone(value),phoneKey(value));
 for(const value of ['0000000000','+44 2079460000','4165550123 ext 5','abc4165550123']) { assert.equal(normalizePhone(value),null); assert.throws(()=>phoneKey(value)); }
});
test('duplicate protection matches formatted legacy phones and respects the time window',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE booking_requests(id TEXT,phone TEXT,created_at INTEGER)');
 db.prepare('INSERT INTO booking_requests VALUES(?,?,?)').run('existing','(416) 555-0123',1000);
 assert.equal(db.prepare(recentPhoneSql).get(500,'4165550123').id,'existing');
 assert.equal(db.prepare(recentPhoneSql).get(1500,'4165550123'),undefined);
 assert.equal(db.prepare(recentPhoneSql).get(500,'6475550123'),undefined);db.close();
});
