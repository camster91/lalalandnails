import {readBookingBody} from './booking-body.ts';
import {quoteBooking,formatBookingEstimate,parseInspirationLinks,validateInspirationImage,inspirationLimits} from './booking-options.ts';
import {pricingDraft} from '../data/pricing.ts';
import {requestWindow,saveTimedRequest,BookingSlotError} from './booking-availability.ts';
import {normalizePhone,recentPhoneSql} from './phone.ts';
import {allowBookingRequest} from './booking-rate-limit.ts';
import {leadSource} from './lead-source.ts';
export type BookingNotification={from:{email:string;name:string};to:string;subject:string;text:string;html:string};
type Dependencies={db:D1Database;ready:()=>Promise<void>;send:(message:BookingNotification)=>Promise<void>;allowDraft:boolean};
const CONTACT_METHODS=new Set(['call','text']);
export async function handleBookingRequest(request:Request,dependencies:Dependencies){
  try {
    if(!pricingDraft.approved&&!dependencies.allowDraft)return json({ok:false,message:'Service selection is not available yet.'},503);
    let input:Record<string,unknown>,files:File[];
    try{({input,files}=await readBookingBody(request));}catch{return json({ok:false,message:'Unable to read your request. Keep images under the stated limits.'},400);}

    if (String(input.website ?? '').trim()) return json({ ok: true }, 202);

    const name = clean(input.name, 80);
    const phone = normalizePhone(clean(input.phone, 40));
    const contactMethod = clean(input.contactMethod, 10);
    const clientNotes = clean(input.notes, 600);
    const vibe = input.vibe;
    const hasVibe = vibe === 'Quiet' || vibe === 'TV' || vibe === 'Music';
    const notes = hasVibe ? [`Appointment vibe: ${vibe}`, clientNotes].filter(Boolean).join('\n') : clientNotes;
    const consent = input.consent === true || input.consent === 'on' || input.consent === 'true';

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = 'Please enter your name.';
    if (!phone) errors.phone = 'Enter a Canadian or US phone number, including area code.';
    if (!CONTACT_METHODS.has(contactMethod)) errors.contactMethod = 'Choose a call or text back.';
    if (!consent) errors.consent = 'Consent is required so La La Land can respond.';

    const preferredDate=clean(input.preferredDate,10), preferredTime=clean(input.preferredTime,5);
    try {requestWindow(preferredDate,preferredTime);} catch(error) {if(error instanceof BookingSlotError)errors[error.field]=error.message;else throw error;}
    let selection:ReturnType<typeof quoteBooking>|undefined,links:string[]=[];
    const images:{mime:string;bytes:Uint8Array}[]=[];
    try{selection=quoteBooking(input);}catch(error){errors.package=(error as Error).message;}
    try{links=parseInspirationLinks(String(input.inspirationLinks||''));}catch(error){errors.inspirationLinks=(error as Error).message;}
    try{
      if(files.length>inspirationLimits.files)throw Error('Choose up to two inspiration images.');
      for(const file of files)images.push(validateInspirationImage(new Uint8Array(await file.arrayBuffer()),file.type));
    }catch(error){errors.inspirationImages=(error as Error).message;}
    if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 400);

    await dependencies.ready();
    const address=request.headers.get('CF-Connecting-IP') || (import.meta.env.DEV?'local-preview':null);
    if(!address)return json({ok:false,message:'Please try again shortly.'},503);
    if(!await allowBookingRequest(dependencies.db,address))return json({ok:false,message:'Too many requests from this connection today. Please try again tomorrow.'},429);
    const duplicate = await dependencies.db.prepare(recentPhoneSql)
      .bind(Date.now() - 10 * 60 * 1000, phone!.slice(-10)).first();

    if (duplicate) {
      return json({ ok: false, message: 'A recent request already uses those contact details. Please wait before trying again.' }, 429);
    }

    const now = Date.now();
    const saved=await saveTimedRequest(dependencies.db,{name,phone:phone!,contactMethod,notes,leadSource:leadSource(input.leadSource),preferredDate,preferredTime,details:{selection:selection!,links,images}},now);
    const id=saved.id;

    // Save the request first so an email outage cannot lose a client's enquiry.
    try {
    const lines = [
        `Hi Bianca,`,
        '',
        `${name} requested ${selection!.serviceName} for ${preferredDate} at ${preferredTime} (Toronto time). The two-hour block is held for your review.`,
        `${contactMethod === 'text' ? 'Text' : 'Call'} ${name} at ${phone} to agree on the service, price and appointment time.`,
        '',
        'Service details',
        `Estimate: ${formatBookingEstimate(selection!)}`,
        `Selections: ${selection!.lines.map(line => line.label).join(', ')}`,
        `Shape: ${selection!.shape}`,
        ...(selection!.needsConsultation ? ['A consultation is needed to confirm this estimate.'] : []),
        ...(hasVibe ? [`Appointment vibe: ${vibe}`] : []),
        ...(clientNotes ? [`Client note: ${clientNotes}`] : []),
        '',
        ...(links.length || images.length ? [`Inspiration to review: ${links.length} link(s), ${images.length} private image(s).`] : []),
        'Review the request in your staff workspace: https://lalalandnails.ca/admin',
        `Request ID: ${id}`,
            ];
      await dependencies.send({
        from: { email: 'requests@lalalandnails.ca', name: 'La La Land Nail Hub' },
        to: 'bianca@ashbi.ca',
        subject: `Booking request · ${preferredDate} at ${preferredTime} · ${selection!.serviceName}`,
        text: lines.join('\n'),
        html: bookingEmailHtml(lines),
      });
    } catch {
      console.error('booking_email_failed', { requestId: id });
    }

    return json({
      ok: true,
      id,
      message: `Your two-hour block on ${preferredDate} at ${preferredTime} (Toronto time) is reserved for review. Bianca will ${contactMethod === 'text' ? 'text' : 'call'} you. Your appointment is confirmed only after you agree on the details.`,
    }, 201);
  } catch (error) {
    if(error instanceof BookingSlotError)return json({ok:false,errors:{[error.field]:error.message}},409);
    console.error('booking_request_failed', error instanceof Error ? error.message : 'unknown');
    return json({ ok: false, message: 'The request could not be sent. Please try again shortly.' }, 500);
  }
}

function clean(value: unknown, maxLength: number): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function bookingEmailHtml(lines: string[]): string {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const workspace = 'https://lalalandnails.ca/admin';
  const body = lines.filter(Boolean).map(line => {
    if (line === 'Service details') return '<h2 style="font:24px Georgia,serif;margin:26px 0 12px">Service details</h2>';
    if (line === 'Review the request in your staff workspace: ' + workspace)
      return '<p style="margin:24px 0"><a href="' + workspace + '" style="display:inline-block;padding:14px 22px;background:#380909;color:#fffaf6;border-radius:24px;text-decoration:none;font-weight:bold">Open staff workspace</a></p>';
    return '<p style="margin:0 0 10px;overflow-wrap:anywhere">' + escape(line) + '</p>';
  }).join('');
  return `<div style="background:#fffaf6;padding:16px;color:#380909;font:16px/1.5 Arial,sans-serif"><div style="max-width:560px;margin:auto"><div style="background:#380909;padding:24px;color:#ffd1df"><img src="https://lalalandnails.ca/brand/nail-hub-lockup.webp" width="110" alt="La La Land" style="display:block"><p style="margin:12px 0 4px;font-weight:bold">La La Land Nail Hub</p><h1 style="margin:0;font:32px Georgia,serif;color:#fffaf6">New booking request</h1></div><div style="padding:24px 12px">${body}</div></div></div>`;
}
