import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import {getD1} from '../../lib/db';
import {studioReady} from '../../lib/studio-db';
import {handleBookingRequest} from '../../lib/booking-request';
export const POST:APIRoute=({request})=>handleBookingRequest(request,{
 db:getD1(),ready:studioReady,allowDraft:import.meta.env.DEV,
 send:async message=>{if(!env.BOOKING_EMAIL)throw Error('Email binding unavailable');await env.BOOKING_EMAIL.send(message);},
});
