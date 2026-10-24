import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {initializeDatabase} from '../src/lib/db-schema.ts';
import {studioSchema} from '../src/lib/studio-schema.ts';
import {capacitySchema, requestWindow, monthAvailability, saveTimedRequest} from '../src/lib/booking-availability.ts';
const now=Date.parse('2026-10-23T12:00:00Z');
async function database(){
 const sql=new DatabaseSync(':memory:');
 const prepare=(s,p=[])=>({bind:(...v)=>prepare(s,v),all:async()=>({results:sql.prepare(s).all(...p)}),first:async()=>sql.prepare(s).get(...p)||null,run:async()=>({meta:sql.prepare(s).run(...p)})});
 const db={prepare,batch:async stmts=>{sql.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 await initializeDatabase(db);for(const s of studioSchema)sql.exec(s);for(const s of capacitySchema)sql.exec(s);
 return {sql,db};
}
const input=(date='2026-10-26',time='10:00')=>({name:'Fictional client',phone:'+14165550123',contactMethod:'text',notes:'',leadSource:'direct',preferredDate:date,preferredTime:time});
test('two-hour weekday blocks fit Toronto 10–3 and reject weekends, past and out-of-window dates',()=>{
 const s=requestWindow('2026-10-26','13:00',now);assert.equal(s.end-s.start,7200000);assert.equal(new Date(s.start).toISOString(),'2026-10-26T17:00:00.000Z');
 assert.equal(new Date(requestWindow('2026-11-02','10:00',now).start).toISOString(),'2026-11-02T15:00:00.000Z');
 for(const [d,t] of [['2026-10-24','10:00'],['2026-10-26','09:00'],['2026-10-26','14:00'],['2026-10-26','10:30'],['2026-10-22','10:00'],['2027-05-01','10:00'],['2026-02-30','10:00']])assert.throws(()=>requestWindow(d,t,now));
});
test('only one request can reserve a day, including a different start time; declining reopens it',async()=>{
 const {sql,db}=await database();
 const a=await saveTimedRequest(db,input(),now);await assert.rejects(saveTimedRequest(db,input('2026-10-26','13:00'),now),/unavailable/);
 assert.equal(sql.prepare('SELECT count(*) n FROM booking_requests').get().n,1);
 let days=await monthAvailability(db,'2026-10',now);assert.deepEqual(days.days.find(x=>x.date==='2026-10-26').times,[]);
 sql.prepare("UPDATE booking_requests SET status='declined' WHERE id=?").run(a.id);
 days=await monthAvailability(db,'2026-10',now);assert.equal(days.days.find(x=>x.date==='2026-10-26').times.length,4);
 await saveTimedRequest(db,input('2026-10-26','13:00'),now);sql.close();
});
test('blocked time hides overlapping blocks and a stale selection is rejected atomically',async()=>{
 const {sql,db}=await database();const w=requestWindow('2026-10-26','10:00',now);
 sql.prepare('INSERT INTO studio_blocks(id,version,start_at,end_at,label) VALUES(?,?,?,?,?)').run('block',now,w.start,w.start+3600000,'Private label');
 const calendar=await monthAvailability(db,'2026-10',now);assert.deepEqual(calendar.days.find(x=>x.date==='2026-10-26').times,['11:00','12:00','13:00']);
 await assert.rejects(saveTimedRequest(db,input(),now),/unavailable/);
 assert.equal(sql.prepare('SELECT count(*) n FROM booking_requests').get().n,0);
 await saveTimedRequest(db,input('2026-10-26','11:00'),now);sql.close();
});
test('manual appointments block the whole day and converting a request does not double-reserve it',async()=>{
 const {sql,db}=await database();const w=requestWindow('2026-10-26','10:00',now);const req=await saveTimedRequest(db,input(),now);
 sql.prepare('INSERT INTO studio_clients(id,version,created_at,name) VALUES(?,?,?,?)').run('client',now,now,'Fictional client');
 sql.prepare('INSERT INTO studio_services(id,version,name,category) VALUES(?,?,?,?)').run('service',now,'Example','Example');
 const insert=sql.prepare("INSERT INTO studio_appointments(id,version,client_id,service_id,lead_id,local_date,start_at,end_at,blocked_until,service_name,price_cents) VALUES(?,?,?,?,?,?,?,?,?,?,?)");
 assert.throws(()=>insert.run('other',now,'client','service',null,'2026-10-26',w.start+10800000,w.end+10800000,w.end+10800000,'Example',0),/unavailable/);
 insert.run('converted',now,'client','service',req.id,'2026-10-26',w.start,w.end,w.end,'Example',0);
 sql.prepare("UPDATE booking_requests SET status='confirmed',capacity_released=1 WHERE id=?").run(req.id);
 await assert.rejects(saveTimedRequest(db,input('2026-10-26','13:00'),now),/unavailable/);
 sql.prepare("UPDATE studio_appointments SET status='cancelled' WHERE id='converted'").run();
 await saveTimedRequest(db,input('2026-10-26','13:00'),now);sql.close();
});

test('studio conversion preserves the requested two-hour block and transfers its capacity claim',async()=>{
 const {db,sql}=await database();
 const {saveStudioCommand}=await import('../src/lib/studio-store.ts');
 const {parseStudioCommand}=await import('../src/lib/studio-validation.ts');
 const save=raw=>saveStudioCommand(parseStudioCommand(raw),db,'test-staff');
 const future=new Date();future.setUTCDate(future.getUTCDate()+3);while([0,6].includes(future.getUTCDay()))future.setUTCDate(future.getUTCDate()+1);
 const date=future.toISOString().slice(0,10);
 const request=await saveTimedRequest(db,input(date,'10:00'));
 const c=await save({action:'client.save',name:'Fictional client',phone:'4165550123'});
 const s=await save({action:'service.save',name:'Example',price:'60',duration:'90',active:true});
 const a=await save({action:'appointment.save',clientId:c.id,serviceId:s.id,leadId:request.id,date,time:'10:00'});
 const row=sql.prepare('SELECT * FROM studio_appointments WHERE id=?').get(a.id);
 assert.equal(row.end_at-row.start_at,7200000);
 assert.equal(sql.prepare('SELECT capacity_released FROM booking_requests WHERE id=?').get(request.id).capacity_released,1);
 await assert.rejects(saveTimedRequest(db,input(date,'13:00')),/unavailable/);
 await save({action:'appointment.status',id:a.id,version:a.version,status:'cancelled'});
 await saveTimedRequest(db,input(date,'13:00'));sql.close();
});
test('blocks cannot silently overwrite an existing public request',async()=>{
 const {sql,db}=await database();const r=await saveTimedRequest(db,input(),now);
 assert.throws(()=>sql.prepare('INSERT INTO studio_blocks(id,version,start_at,end_at,label) VALUES(?,?,?,?,?)').run('b',now,r.start,r.end,'Unavailable'),/unavailable/);sql.close();
});

test('daily request rate limit is atomic per network and expires without storing raw addresses',async()=>{
 const {sql,db}=await database();const {allowBookingRequest}=await import('../src/lib/booking-rate-limit.ts');
 const results=await Promise.all(Array.from({length:8},()=>allowBookingRequest(db,'192.0.2.1',now)));
 assert.equal(results.filter(Boolean).length,3);
 assert.equal(await allowBookingRequest(db,'192.0.2.2',now),true);
 assert.equal(await allowBookingRequest(db,'192.0.2.1',now+86400000),true);
 const rows=sql.prepare('SELECT * FROM chat_rate_limits').all();assert.equal(rows.length,1);
 assert.equal(JSON.stringify(rows).includes('192.0.2.'),false);sql.close();
});
