import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {initializeDatabase} from '../src/lib/db-schema.ts';
import {initializeStudio} from '../src/lib/studio-schema.ts';
import {handleBookingRequest} from '../src/lib/booking-request.ts';
import {bookingDetails,bookingInspiration} from '../src/lib/booking-details.ts';
import {monthAvailability} from '../src/lib/booking-availability.ts';
async function setup(){
 const sql=new DatabaseSync(':memory:');
 const prepare=(query,params=[])=>({bind:(...v)=>prepare(query,v.map(x=>x instanceof ArrayBuffer?new Uint8Array(x):x)),first:async()=>sql.prepare(query).get(...params)||null,all:async()=>({results:sql.prepare(query).all(...params)}),run:async()=>({meta:sql.prepare(query).run(...params)})});
 const db={prepare,batch:async stmts=>{sql.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 await initializeDatabase(db);await initializeStudio(db);const sent=[];
 return {sql,db,sent,dependencies:{db,ready:async()=>{},allowDraft:true,send:async message=>{sent.push(message);}}};
}
const date=()=>{const d=new Date();d.setUTCDate(d.getUTCDate()+3);while([0,6].includes(d.getUTCDay()))d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
function request(overrides={},image=true){
 const form=new FormData();for(const [k,v] of Object.entries({name:'Fictional QA client',phone:'4165550123',contactMethod:'text',consent:'on',preferredDate:date(),preferredTime:'10:00',package:'structured',length:'medium',art:'2',inspirationLinks:'https://pin.it/fictional-qa',...overrides}))form.set(k,v);
 if(image)form.append('inspirationImages',new File([readFileSync(new URL('./fixtures/inspiration.jpg',import.meta.url))],'nails.jpg',{type:'image/jpeg'}));
 return new Request('https://example.com/api/bookings',{method:'POST',headers:{'CF-Connecting-IP':'192.0.2.1'},body:form});
}
test('complete request saves the server estimate, private inspiration and review notification once',async()=>{
 const {sql,db,sent,dependencies}=await setup();
 const response=await handleBookingRequest(request({total:'1'}),dependencies);assert.equal(response.status,201);
 const result=await response.json(),details=await bookingDetails(db,result.id);
 assert.equal(details.selection.total,105);assert.deepEqual(details.links,['https://pin.it/fictional-qa']);assert.equal(details.images.length,1);
 const image=await bookingInspiration(db,details.images[0].url.split('/').at(-1));assert.equal(image.mime,'image/jpeg');assert.ok(image.image.length>0);
 assert.equal(sent.length,1);assert.equal(sent[0].to,'bianca@ashbi.ca');assert.match(sent[0].text,/105\.00 CAD/);assert.doesNotMatch(sent[0].text,/pin\.it|api\/admin\/inspiration/);
 const available=await monthAvailability(db,date().slice(0,7));assert.deepEqual(available.days.find(d=>d.date===date()).times,[]);
 assert.doesNotMatch(JSON.stringify(available),/Fictional|pin\.it|nails\.jpg|selection/);
 const retry=await handleBookingRequest(request(),dependencies);assert.equal(retry.status,429);assert.equal(sent.length,1);
 assert.equal(sql.prepare('SELECT count(*) n FROM booking_requests').get().n,1);sql.close();
});
test('a stale competing request never creates a second day hold, detail or image',async()=>{
 const {sql,dependencies,sent}=await setup();assert.equal((await handleBookingRequest(request(),dependencies)).status,201);
 assert.equal((await handleBookingRequest(request({phone:'4165550124',preferredTime:'13:00'}),dependencies)).status,409);
 for(const table of ['booking_requests','booking_request_details','booking_inspiration'])assert.equal(sql.prepare(`SELECT count(*) n FROM ${table}`).get().n,1);
 assert.equal(sent.length,1);sql.close();
});
test('notification failure preserves the request instead of inviting duplicate delivery',async()=>{
 const {sql,dependencies}=await setup();let attempts=0;dependencies.send=async()=>{attempts++;throw Error('Simulated provider outage');};
 assert.equal((await handleBookingRequest(request(),dependencies)).status,201);
 assert.equal((await handleBookingRequest(request(),dependencies)).status,429);assert.equal(attempts,1);
 assert.equal(sql.prepare('SELECT count(*) n FROM booking_requests').get().n,1);sql.close();
});
test('help-me-choose is saved and sent as a consultation without a zero-dollar quote',async()=>{
 const {db,sql,dependencies,sent}=await setup();const response=await handleBookingRequest(request({package:'unsure'},false),dependencies);
 assert.equal(response.status,201);const details=await bookingDetails(db,(await response.json()).id);assert.equal(details.selection.total,null);
 assert.match(sent[0].text,/help me choose/);assert.doesNotMatch(sent[0].text,/\$0/);sql.close();
});
test('draft activation and invalid files cannot create or notify a booking',async()=>{
 const {sql,dependencies,sent}=await setup();assert.equal((await handleBookingRequest(request(),{...dependencies,allowDraft:false})).status,503);
 const form=await request({},false).formData();form.append('inspirationImages',new File(['not an image'],'fake.jpg',{type:'image/jpeg'}));
 const response=await handleBookingRequest(new Request('https://example.com/api/bookings',{method:'POST',headers:{'CF-Connecting-IP':'192.0.2.1'},body:form}),dependencies);
 assert.equal(response.status,400);assert.ok((await response.json()).errors.inspirationImages);assert.equal(sent.length,0);
 assert.equal(sql.prepare('SELECT count(*) n FROM booking_requests').get().n,0);sql.close();
});

test('staff explicitly agrees the final price and rescheduling preserves it before cancellation releases the day',async()=>{
 const {db,sql,dependencies}=await setup();const {saveStudioCommand}=await import('../src/lib/studio-store.ts');const {parseStudioCommand}=await import('../src/lib/studio-validation.ts');
 const save=raw=>saveStudioCommand(parseStudioCommand(raw),db,'fictional-staff');
 const submitted=await handleBookingRequest(request(),dependencies),leadId=(await submitted.json()).id;
 const client=await save({action:'client.save',name:'Fictional QA client',phone:'4165550123'});
 const service=await save({action:'service.save',name:'Structured gel',price:'75',duration:'120',active:true});
 const command={action:'appointment.save',clientId:client.id,serviceId:service.id,leadId,date:date(),time:'10:00'};
 await assert.rejects(save(command),/agreed price/i);
 const appointment=await save({...command,price:'105'});let row=sql.prepare('SELECT * FROM studio_appointments WHERE id=?').get(appointment.id);assert.equal(row.price_cents,10500);
 const serviceRow=sql.prepare('SELECT * FROM studio_services WHERE id=?').get(service.id);
 await save({action:'service.save',id:service.id,version:serviceRow.version,name:'Structured gel',price:'90',duration:'120',active:true});
 const moved=new Date(date()+'T12:00Z');moved.setUTCDate(moved.getUTCDate()+1);while([0,6].includes(moved.getUTCDay()))moved.setUTCDate(moved.getUTCDate()+1);const movedDate=moved.toISOString().slice(0,10);
 await save({...command,id:row.id,version:row.version,leadId:undefined,date:movedDate});row=sql.prepare('SELECT * FROM studio_appointments WHERE id=?').get(row.id);assert.equal(row.price_cents,10500);
 const originalAvailability=await monthAvailability(db,date().slice(0,7));assert.equal(originalAvailability.days.find(d=>d.date===date()).times.length,4);
 const movedAvailability=await monthAvailability(db,movedDate.slice(0,7));assert.equal(movedAvailability.days.find(d=>d.date===movedDate).times.length,0);
 await save({action:'appointment.status',id:row.id,version:row.version,status:'cancelled'});
 const available=await monthAvailability(db,movedDate.slice(0,7));assert.equal(available.days.find(d=>d.date===movedDate).times.length,4);
 assert.equal((await bookingDetails(db,leadId)).images.length,1);sql.close();
});
