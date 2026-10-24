export async function bookingDetails(db:D1Database,id:string){
 const detail=await db.prepare('SELECT selection_json,inspiration_links_json FROM booking_request_details WHERE request_id=?').bind(id).first<{selection_json:string;inspiration_links_json:string}>();
 const images=await db.prepare('SELECT id FROM booking_inspiration WHERE request_id=? ORDER BY created_at,id').bind(id).all<{id:string}>();
 return {selection:detail?JSON.parse(detail.selection_json):null,links:detail?JSON.parse(detail.inspiration_links_json):[],images:images.results.map(i=>({url:`/api/admin/inspiration/${i.id}`}))};
}
export async function bookingInspiration(db:D1Database,id:string){
 return db.prepare('SELECT mime,image FROM booking_inspiration WHERE id=?').bind(id).first<{mime:string;image:ArrayBuffer|number[]}>();
}
