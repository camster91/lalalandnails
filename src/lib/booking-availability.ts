import {torontoInstant} from './studio-validation.ts';
import {torontoDate} from './crm.ts';
import {bookingPolicy,bookingTimes} from './booking-policy.ts';
export {bookingTimes} from './booking-policy.ts';
export class BookingSlotError extends Error {
  field: string;
  constructor(message: string, field='preferredDate'){super(message);this.field=field;}
}
export function requestWindow(date: string,time: string,now=Date.now()) {
  const today=torontoDate(new Date(now));
  const last=new Date(today+'T12:00:00Z');last.setUTCDate(last.getUTCDate()+bookingPolicy.horizonDays);
  if(!/^20\d{2}-\d{2}-\d{2}$/.test(date) || date<today || date>last.toISOString().slice(0,10)) throw new BookingSlotError('Choose a date within the next 90 days.');
  const noon=new Date(date+'T12:00:00Z');
  if(!Number.isFinite(noon.getTime()) || noon.toISOString().slice(0,10)!==date || [0,6].includes(noon.getUTCDay())) throw new BookingSlotError('Choose a Monday–Friday date.');
  if(!bookingTimes.includes(time)) throw new BookingSlotError('Choose a two-hour block between 10 a.m. and 3 p.m.','preferredTime');
  const start=torontoInstant(date,time),dayStart=torontoInstant(date,'00:00');
  if(start<=now)throw new BookingSlotError('That start time has passed. Choose a later block.','preferredTime');
  return {date,time,start,end:start+7200000,dayStart,dayEnd:dayStart+86400000};
}
const held="requested_start IS NOT NULL AND capacity_released=0 AND status!='declined'";
export const capacitySchema=[
 `CREATE UNIQUE INDEX IF NOT EXISTS booking_request_one_day ON booking_requests(preferred_date) WHERE ${held}`,
 `CREATE INDEX IF NOT EXISTS studio_appointment_local_date ON studio_appointments(local_date,status)`,
 ...['INSERT','UPDATE'].map(event=>`CREATE TRIGGER IF NOT EXISTS booking_request_capacity_${event.toLowerCase()} BEFORE ${event} ON booking_requests WHEN NEW.requested_start IS NOT NULL AND NEW.capacity_released=0 AND NEW.status!='declined' BEGIN
 SELECT RAISE(ABORT,'booking_day_unavailable') WHERE NEW.requested_end IS NULL OR NEW.requested_day_start IS NULL OR NEW.requested_day_end IS NULL OR NEW.requested_end-NEW.requested_start!=7200000;
 SELECT RAISE(ABORT,'booking_day_unavailable') WHERE EXISTS(SELECT 1 FROM studio_appointments a WHERE a.status!='cancelled' AND a.start_at<NEW.requested_day_end AND a.blocked_until>NEW.requested_day_start AND COALESCE(a.lead_id,'')!=NEW.id) OR EXISTS(SELECT 1 FROM studio_blocks b WHERE b.archived_at IS NULL AND b.start_at<NEW.requested_end AND b.end_at>NEW.requested_start); END`),
 ...['INSERT','UPDATE'].map(event=>`CREATE TRIGGER IF NOT EXISTS studio_daily_capacity_${event.toLowerCase()} BEFORE ${event} ON studio_appointments WHEN NEW.status!='cancelled' AND NEW.local_date IS NOT NULL BEGIN
 SELECT RAISE(ABORT,'booking_day_unavailable') WHERE EXISTS(SELECT 1 FROM studio_appointments a WHERE a.id!=NEW.id AND a.local_date=NEW.local_date AND a.status!='cancelled') OR EXISTS(SELECT 1 FROM booking_requests r WHERE r.preferred_date=NEW.local_date AND r.requested_start IS NOT NULL AND r.capacity_released=0 AND r.status!='declined' AND r.id!=COALESCE(NEW.lead_id,'')); END`),
 ...['INSERT','UPDATE'].map(event=>`CREATE TRIGGER IF NOT EXISTS studio_block_request_${event.toLowerCase()} BEFORE ${event} ON studio_blocks WHEN NEW.archived_at IS NULL BEGIN
 SELECT RAISE(ABORT,'booking_day_unavailable') WHERE EXISTS(SELECT 1 FROM booking_requests r WHERE r.requested_start IS NOT NULL AND r.capacity_released=0 AND r.status!='declined' AND r.requested_start<NEW.end_at AND r.requested_end>NEW.start_at); END`),
];
export async function monthAvailability(db: D1Database,month: string,now=Date.now()) {
  if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw new BookingSlotError('Choose a valid month.');
  const today=torontoDate(new Date(now));const last=new Date(today+'T12:00:00Z');last.setUTCDate(last.getUTCDate()+bookingPolicy.horizonDays);
  if(month<today.slice(0,7)||month>last.toISOString().slice(0,7))throw new BookingSlotError('Choose a month within the next 90 days.');
  const from=Date.parse(month+'-01T00:00:00Z')-86400000;
  const to=new Date(month+'-01T00:00:00Z');to.setUTCMonth(to.getUTCMonth()+1);
  const [appointments,blocks,requests]=await Promise.all([
    db.prepare("SELECT start_at,blocked_until FROM studio_appointments WHERE status!='cancelled' AND start_at<? AND blocked_until>?").bind(to.getTime()+86400000,from).all<{start_at:number;blocked_until:number}>(),
    db.prepare('SELECT start_at,end_at FROM studio_blocks WHERE archived_at IS NULL AND start_at<? AND end_at>?').bind(to.getTime()+86400000,from).all<{start_at:number;end_at:number}>(),
    db.prepare(`SELECT preferred_date FROM booking_requests WHERE ${held} AND preferred_date LIKE ?`).bind(month+'-%').all<{preferred_date:string}>(),
  ]);
  const days=[];
  for(let d=1;d<=31;d++){
    const date=month+'-'+String(d).padStart(2,'0');const calendarDate=new Date(date+'T12:00:00Z');
    if(!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0,10)!==date)continue;
    const times=bookingTimes.filter(time=>{try{
      const w=requestWindow(date,time,now);
      return !requests.results.some(r=>r.preferred_date===date) && !appointments.results.some(a=>a.start_at<w.dayEnd&&a.blocked_until>w.dayStart) && !blocks.results.some(b=>b.start_at<w.end&&b.end_at>w.start);
    }catch{return false;}});
    days.push({date,times});
  }
  return {month,days,timezone:bookingPolicy.timezone,duration:bookingPolicy.durationMinutes,maxPerDay:bookingPolicy.maxPerDay,today,lastDate:last.toISOString().slice(0,10)};
}
type TimedRequest={name:string;phone:string;contactMethod:string;notes:string;leadSource:string;preferredDate:string;preferredTime:string;details?:{selection:unknown;links:string[];images:{mime:string;bytes:Uint8Array}[]}};
export async function saveTimedRequest(db: D1Database,input: TimedRequest,now=Date.now()) {
  const w=requestWindow(input.preferredDate,input.preferredTime,now),id=crypto.randomUUID();
  try {
    const insert=db.prepare(`INSERT INTO booking_requests(id,created_at,updated_at,name,phone,contact_method,lead_source,preferred_date,preferred_time,requested_start,requested_end,requested_day_start,requested_day_end,notes,consent_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,now,now,input.name,input.phone,input.contactMethod,input.leadSource,w.date,w.time,w.start,w.end,w.dayStart,w.dayEnd,input.notes,now);
    const statements=[insert];
    if(input.details){
      statements.push(db.prepare('INSERT INTO booking_request_details(request_id,selection_json,inspiration_links_json) VALUES(?,?,?)').bind(id,JSON.stringify(input.details.selection),JSON.stringify(input.details.links)));
      for(const image of input.details.images)statements.push(db.prepare('INSERT INTO booking_inspiration(id,request_id,mime,image,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,image.mime,image.bytes.buffer.slice(image.bytes.byteOffset,image.bytes.byteOffset+image.bytes.byteLength),now));
    }
    await db.batch(statements);
  }catch(error){
    const message=error instanceof Error?error.message:'';
    if(/booking_day_unavailable|booking_requests.preferred_date|booking_request_one_day/.test(message))throw new BookingSlotError('That day or block is unavailable. Please choose another date or time.');
    throw error;
  }
  return {id,...w};
}
