import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {quoteBooking,formatBookingEstimate,parseInspirationLinks,validateInspirationImage} from '../src/lib/booking-options.ts';
const pick=(extra={})=>({package:'structured',length:'short',art:'none',reconstruction:'none',repair:'none',repairCount:'0',shape:'Almond',...extra});
test('package estimate includes length and art once; fill prices already include length',()=>{
 assert.equal(quoteBooking(pick({length:'medium',art:'2'})).total,105);
 assert.equal(quoteBooking(pick({package:'fill-medium',length:'long'})).total,80);
});
test('reconstruction and individual repairs cannot charge for the same work',()=>{
 assert.throws(()=>quoteBooking(pick({reconstruction:'2',repair:'structured',repairCount:'1'})),/repair/i);
 assert.equal(quoteBooking(pick({reconstruction:'2'})).total,95);
});
test('consultation and complex options are identified rather than guaranteed to fit two hours',()=>{
 assert.equal(quoteBooking(pick({art:'4'})).needsConsultation,true);
 assert.equal(quoteBooking(pick({length:'extra-long'})).needsConsultation,true);
 assert.throws(()=>quoteBooking(pick({package:'fake'})),/service/i);
 assert.throws(()=>quoteBooking(pick({repair:'broken',repairCount:'99'})),/repair/i);
});
test('inspiration links accept public HTTPS without fetching or unsafe schemes',()=>{
 assert.equal(parseInspirationLinks('https://pin.it/example\nhttps://www.instagram.com/p/example/').length,2);
 for(const link of ['javascript:alert(1)','http://example.com','https://localhost/a','https://127.0.0.1/a','https://name:password@example.com/a','https://example.local/a'])assert.throws(()=>parseInspirationLinks(link));
 assert.throws(()=>parseInspirationLinks(Array(4).fill('https://example.com/a').join('\n')));
});
test('inspiration image validation rejects fake MIME types, oversized files and SVG',()=>{
 const jpeg=new Uint8Array(readFileSync(new URL('./fixtures/inspiration.jpg',import.meta.url)));
 assert.equal(validateInspirationImage(jpeg,'image/jpeg').mime,'image/jpeg');
 assert.throws(()=>validateInspirationImage(new Uint8Array([255,216,255,217]),'image/jpeg'));
 const huge=jpeg.slice();for(let i=0;i<huge.length-8;i++){if(huge[i]===255&&huge[i+1]===192){huge[i+5]=255;huge[i+6]=255;break;}}
 assert.throws(()=>validateInspirationImage(huge,'image/jpeg'),/smaller/);
 assert.throws(()=>validateInspirationImage(new TextEncoder().encode('<svg/>'),'image/svg+xml'));
 assert.throws(()=>validateInspirationImage(new TextEncoder().encode('<script>'),'image/jpeg'));
 assert.throws(()=>validateInspirationImage(new Uint8Array(300001),'image/png'));
});

test('request body is bounded even without Content-Length',async()=>{
 const {readBookingBody}=await import('../src/lib/booking-body.ts');
 const request=new Request('https://example.com/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({notes:'x'.repeat(700001)})});
 await assert.rejects(readBookingBody(request),/too large/);
});
test('multipart request preserves optional inspiration files and package values',async()=>{
 const {readBookingBody}=await import('../src/lib/booking-body.ts');
 const data=new FormData();data.set('package','structured');data.append('inspirationImages',new File([new Uint8Array([1,2,3])],'example.jpg',{type:'image/jpeg'}));
 const result=await readBookingBody(new Request('https://example.com/api/bookings',{method:'POST',body:data}));
 assert.equal(result.input.package,'structured');assert.equal(result.files.length,1);
});

test('JPEG cannot hide oversized dimensions behind a duplicate small frame header',()=>{
 const jpeg=new Uint8Array(readFileSync(new URL('./fixtures/inspiration.jpg',import.meta.url)));
 const sof=jpeg.findIndex((b,i)=>b===255&&jpeg[i+1]===192),length=(jpeg[sof+2]<<8)|jpeg[sof+3],end=sof+2+length;
 const duplicate=new Uint8Array(jpeg.length+length+2);duplicate.set(jpeg.slice(0,end));duplicate.set(jpeg.slice(sof,end),end);duplicate.set(jpeg.slice(end),end+length+2);duplicate[sof+5]=255;duplicate[sof+6]=255;
 assert.throws(()=>validateInspirationImage(duplicate,'image/jpeg'));
});

test('help-me-choose requests have no invented price and remain valid without technical options',()=>{
 const quote=quoteBooking({package:'unsure'});
 assert.equal(quote.serviceId,'unsure');assert.equal(quote.total,null);
 assert.equal(quote.needsConsultation,true);assert.deepEqual(quote.lines,[]);assert.doesNotMatch(formatBookingEstimate(quote),/\$/);
});
test('unknown length or art retains only a starting estimate for consultation',()=>{
 const quote=quoteBooking(pick({length:'unsure',art:'unsure'}));
 assert.equal(quote.total,75);assert.equal(quote.needsConsultation,true);
});
