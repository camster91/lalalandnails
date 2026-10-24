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
  const detail=await db.prepare('SELECT selection_json,inspiration_links_json FROM booking_request_details WHERE request_id=?').bind(params.id).first<{selection_json:string;inspiration_links_json:string}>();
  const images=await db.prepare('SELECT id FROM booking_inspiration WHERE request_id=? ORDER BY created_at,id').bind(params.id).all<{id:string}>();
  return Response.json({selection:detail?JSON.parse(detail.selection_json):null,links:detail?JSON.parse(detail.inspiration_links_json):[],images:images.results.map(i=>({url:`/api/admin/inspiration/${i.id}`}))},{headers:privateHeaders});
 }catch{return Response.json({error:'Unable to load request details.'},{status:503,headers:privateHeaders});}
};
