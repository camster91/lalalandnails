import {bookingDetails} from '../../../../../lib/booking-details';
import type {APIRoute} from 'astro';
import {getStaffAccess,privateHeaders} from '../../../../../lib/auth';
import {getD1,ensureDatabase} from '../../../../../lib/db';
export const prerender=false;
export const GET:APIRoute=async({request,params})=>{
 const access=await getStaffAccess(request);
 if(!access.configured||!access.user)return Response.json({error:'Staff sign-in required.'},{status:access.configured?401:503,headers:privateHeaders});
 if(!/^[a-f0-9-]{36}$/i.test(params.id||''))return Response.json({error:'Not found'},{status:404,headers:privateHeaders});
 try{
  await ensureDatabase();const db=getD1();
  return Response.json(await bookingDetails(db,params.id!),{headers:privateHeaders});
 }catch{return Response.json({error:'Unable to load request details.'},{status:503,headers:privateHeaders});}
};
