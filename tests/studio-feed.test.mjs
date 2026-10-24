import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendarFeed, tokenDigest, createFeedToken } from '../src/lib/studio-feed.ts';
test('subscription feed uses stable UIDs, UTC times and explicit cancellation without private client data',async()=>{
 const rows=[{id:'123',version:Date.parse('2026-10-23T12:00Z'),start_at:Date.parse('2026-10-24T13:00Z'),end_at:Date.parse('2026-10-24T14:30Z'),status:'confirmed',name:'Private client',notes:'Private note',phone:'4165550199'}];
 const first=createCalendarFeed(rows);assert.ok(first.includes('UID:123@lalalandnails.ca'));assert.ok(first.includes('DTSTART:20261024T130000Z'));assert.ok(first.includes('STATUS:CONFIRMED'));
 for(const value of ['Private client','Private note','4165550199'])assert.ok(!first.includes(value));
 const changed=createCalendarFeed([{...rows[0],status:'cancelled',version:rows[0].version+1000}]);assert.ok(changed.includes('STATUS:CANCELLED'));assert.ok(changed.includes('UID:123@lalalandnails.ca'));
 assert.ok(first.endsWith('END:VCALENDAR\r\n'));assert.ok(!first.replace(/\r\n/g,'').includes('\n'));
});
test('feed tokens are unguessable and only their digests need storage',async()=>{const a=createFeedToken(),b=createFeedToken();assert.match(a,/^[a-f0-9]{64}$/);assert.notEqual(a,b);assert.equal((await tokenDigest(a)).length,64);assert.notEqual(await tokenDigest(a),a);});

test('private feed can be rotated and revoked without persisting its bearer token',async()=>{
 const {DatabaseSync}=await import('node:sqlite');
 const {feedState,changeFeed}=await import('../src/lib/studio-feed.ts');
 const sql=new DatabaseSync(':memory:');
 sql.exec('CREATE TABLE studio_activity(id TEXT,created_at INTEGER,actor TEXT,action TEXT,record_id TEXT)');
 const prepare=(s,p=[])=>({bind:(...v)=>prepare(s,v),first:async()=>sql.prepare(s).get(...p)||null,run:async()=>sql.prepare(s).run(...p)});
 const db={prepare,batch:async(stmts)=>{sql.exec('BEGIN');try{for(const s of stmts)await s.run();sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
 assert.equal(await feedState(db),null);
 const first=await changeFeed(db,'staff',true);
 assert.equal((await feedState(db)).token_hash,await tokenDigest(first));
 const second=await changeFeed(db,'staff',true);
 assert.notEqual(first,second);
 assert.notEqual((await feedState(db)).token_hash,await tokenDigest(first));
 await changeFeed(db,'staff',false);
 assert.equal((await feedState(db)).token_hash,null);
 assert.equal(sql.prepare('SELECT count(*) n FROM studio_activity').get().n,3);
 sql.close();
});

test('requested blocks publish tentative events that keep their UID on confirmation',()=>{
 const row={id:'request-123',version:Date.parse('2026-10-23T12:00Z'),start_at:Date.parse('2026-10-26T14:00Z'),end_at:Date.parse('2026-10-26T16:00Z'),status:'tentative'};
 assert.ok(createCalendarFeed([row]).includes('STATUS:TENTATIVE'));
 assert.ok(createCalendarFeed([{...row,status:'confirmed'}]).includes('UID:request-123@lalalandnails.ca'));
});
