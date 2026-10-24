import type { APIRoute } from 'astro';
import {readBookingBody} from '../../lib/booking-body';
import {quoteBooking,formatBookingEstimate,parseInspirationLinks,validateInspirationImage,inspirationLimits} from '../../lib/booking-options';
import {pricingDraft} from '../../data/pricing';
import { env } from 'cloudflare:workers';
import { getD1 } from '../../lib/db';
import { studioReady } from '../../lib/studio-db';
import { requestWindow,saveTimedRequest,BookingSlotError } from '../../lib/booking-availability';

import { normalizePhone, recentPhoneSql } from '../../lib/phone';

import { allowBookingRequest } from '../../lib/booking-rate-limit';

import { leadSource } from '../../lib/lead-source';

const CONTACT_METHODS = new Set(['call', 'text']);

export const POST: APIRoute = async ({ request }) => {
  try {
    if(!pricingDraft.approved&&!import.meta.env.DEV)return json({ok:false,message:'Service selection is not available yet.'},503);
    let input:Record<string,unknown>,files:File[];
    try{({input,files}=await readBookingBody(request));}catch{return json({ok:false,message:'Unable to read your request. Keep images under the stated limits.'},400);}

    if (String(input.website ?? '').trim()) return json({ ok: true }, 202);

    const name = clean(input.name, 80);
    const phone = normalizePhone(clean(input.phone, 40));
    const contactMethod = clean(input.contactMethod, 10);
    const notes = clean(input.notes, 600);
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

    await studioReady();
    const address=request.headers.get('CF-Connecting-IP') || (import.meta.env.DEV?'local-preview':null);
    if(!address)return json({ok:false,message:'Please try again shortly.'},503);
    if(!await allowBookingRequest(getD1(),address))return json({ok:false,message:'Too many requests from this connection today. Please try again tomorrow.'},429);
    const duplicate = await getD1().prepare(recentPhoneSql)
      .bind(Date.now() - 10 * 60 * 1000, phone!.slice(-10)).first();

    if (duplicate) {
      return json({ ok: false, message: 'A recent request already uses those contact details. Please wait before trying again.' }, 429);
    }

    const now = Date.now();
    const saved=await saveTimedRequest(getD1(),{name,phone:phone!,contactMethod,notes,leadSource:leadSource(input.leadSource),preferredDate,preferredTime,details:{selection:selection!,links,images}},now);
    const id=saved.id;

    // Save the request first so an email outage cannot lose a client's enquiry.
    try {
      if (!env.BOOKING_EMAIL) throw new Error('Email binding unavailable');
      await env.BOOKING_EMAIL.send({
        from: { email: 'requests@lalalandnails.ca', name: 'La La Land Nail Hub' },
        to: 'bianca@ashbi.ca',
        subject: `New La La Land time request · ${contactMethod === 'text' ? 'text' : 'call'}-back request`,
        text: [
          'A client has requested a European manicure appointment.',
          '',
          `Name: ${name}`,
          `Phone: ${phone}`,
          `Requested block: ${preferredDate} at ${preferredTime}, 2 hours (America/Toronto)`,
          `Service estimate: ${selection!.serviceName} · ${formatBookingEstimate(selection!)}`,
          `Selected options: ${selection!.lines.map(l=>l.label).join(' + ')}; shape: ${selection!.shape}`,
          `Consultation required: ${selection!.needsConsultation?'Yes':'Confirm suitability and timing'}`,
          `Inspiration: ${links.length} link(s), ${images.length} private image(s). Review in the staff workspace.`,
          `Staff workspace: https://lalalandnails.ca/admin`,
          `Reply by: ${contactMethod === 'text' ? 'Text message' : 'Phone call'}`,
          `Message: ${notes || 'No message provided.'}`,
          '',
          `Request ID: ${id}`,
          'Please contact the client to discuss availability and confirm the details.',
        ].join('\n'),
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
};

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
