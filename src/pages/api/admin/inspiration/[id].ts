import {bookingInspiration} from '../../../../lib/booking-details';
import type {APIRoute} from 'astro';
import {getStaffAccess,privateHeaders} from '../../../../lib/auth';
import {getD1,ensureDatabase} from '../../../../lib/db';
export const prerender=false;
export const GET:APIRoute=async({request,params})=>{
 const access=await getStaffAccess(request);
 if(!access.configured||!access.user)return new Response('Staff sign-in required.',{status:access.configured?401:503,headers:privateHeaders});
 if(!/^[a-f0-9-]{36}$/i.test(params.id||''))return new Response('Not found',{status:404,headers:privateHeaders});
 try{
  await ensureDatabase();
  const row=await bookingInspiration(getD1(),params.id!);
  if(!row)return new Response('Not found',{status:404,headers:privateHeaders});
  return new Response(Array.isArray(row.image)?new Uint8Array(row.image):row.image,{headers:{...privateHeaders,'Content-Type':row.mime,'X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="nail-inspiration"','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }catch{return new Response('Image temporarily unavailable',{status:503,headers:privateHeaders});}
};
