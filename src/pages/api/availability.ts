import type {APIRoute} from 'astro';
import {getD1} from '../../lib/db';
import {studioReady} from '../../lib/studio-db';
import {monthAvailability,BookingSlotError} from '../../lib/booking-availability';
import {torontoDate} from '../../lib/crm';
export const prerender=false;
export const GET:APIRoute=async({url})=>{
 const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
 try {
  const month=url.searchParams.get('month')||torontoDate().slice(0,7);
  // Validate before initializing/querying private tables; return only date/time availability.
  if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw new BookingSlotError('Choose a valid month.');
  await studioReady();
  return Response.json(await monthAvailability(getD1(),month),{headers});
 } catch(error){return Response.json({error:error instanceof BookingSlotError?error.message:'Calendar temporarily unavailable. Please try again.'},{status:error instanceof BookingSlotError?400:503,headers});}
};
