import test from 'node:test';
import assert from 'node:assert/strict';
import { googleCalendarLink } from '../src/lib/studio-calendar.ts';
test('calendar handoff preserves exact instants and Toronto timezone without client information',()=>{
 const href=googleCalendarLink({start_at:Date.parse('2026-10-23T13:00:00Z'),end_at:Date.parse('2026-10-23T14:30:00Z'),status:'confirmed',name:'Private client',phone:'4165550199',notes:'Private consultation'});
 const url=new URL(href);assert.equal(url.origin,'https://calendar.google.com');assert.equal(url.searchParams.get('dates'),'20261023T130000Z/20261023T143000Z');assert.equal(url.searchParams.get('stz'),'America/Toronto');assert.equal(url.searchParams.get('etz'),'America/Toronto');
 for(const privateText of ['Private client','4165550199','Private consultation'])assert.equal(decodeURIComponent(href).includes(privateText),false);
});
test('cancelled or malformed appointments cannot produce a calendar handoff',()=>{
 assert.equal(googleCalendarLink({start_at:1,end_at:2,status:'cancelled'}),null);
 assert.equal(googleCalendarLink({start_at:NaN,end_at:2,status:'confirmed'}),null);
 assert.equal(googleCalendarLink({start_at:2,end_at:1,status:'confirmed'}),null);
});
