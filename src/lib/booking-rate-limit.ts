// A daily, pseudonymous network bucket protects the single daily appointment.
// Raw network addresses are never stored; expired buckets are removed on the next validated request.
export async function allowBookingRequest(db: D1Database, address: string, now=Date.now()) {
  const day=Math.floor(now/86400000);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`booking:${day}:${address}`));
  const key='booking:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  await db.prepare('DELETE FROM chat_rate_limits WHERE expires_at<=?').bind(now).run();
  const row=await db.prepare(`INSERT INTO chat_rate_limits(key,count,expires_at) VALUES(?,1,?)
    ON CONFLICT(key) DO UPDATE SET count=MIN(chat_rate_limits.count+1,4)
    RETURNING count`).bind(key,(day+1)*86400000).first<{count:number}>();
  return !!row && row.count<=3;
}
