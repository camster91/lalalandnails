import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from '../src/lib/db-schema.ts';
import { studioSchema } from "../src/lib/studio-schema.ts";
import { saveStudioCommand, studioSnapshot } from "../src/lib/studio-store.ts";
import { parseStudioCommand } from "../src/lib/studio-validation.ts";
function database() {
  const sql = new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys=ON");
  for (const s of studioSchema) sql.exec(s);
  const prepare = (s, p = []) => ({
    bind: (...v) => prepare(s, v),
    all: async () => ({ results: sql.prepare(s).all(...p) }),
    first: async () => sql.prepare(s).get(...p) || null,
    run: async () => ({ meta: sql.prepare(s).run(...p) }),
  });
  const db = {
    prepare,
    batch: async (stmts) => {
      sql.exec("BEGIN");
      try {
        const out = [];
        for (const s of stmts) out.push(await s.run());
        sql.exec("COMMIT");
        return out;
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return { sql, db };
}
test("client deduplication, service setup, booking conflicts, stale edits and blocked time persist", async () => {
  const { sql, db } = database();
  const save = (raw) =>
    saveStudioCommand(parseStudioCommand(raw), db, "test-staff");
  const client = await save({
    action: "client.save",
    name: "Fictional person",
    phone: "4165550123",
  });
  await assert.rejects(
    save({ action: "client.save", name: "Duplicate", phone: "+14165550123" }),
    /already exists/,
  );
  const service = await save({
    action: "service.save",
    name: "Structured gel",
    price: "65",
    duration: "90",
    buffer: "15",
    active: true,
  });
  const booking = await save({
    action: "appointment.save",
    clientId: client.id,
    serviceId: service.id,
    date: "2026-10-23",
    time: "09:00",
  });
  await assert.rejects(
    save({
      action: "appointment.save",
      clientId: client.id,
      serviceId: service.id,
      date: "2026-10-23",
      time: "10:30",
    }),
    /overlap/,
  );
  await assert.rejects(
    save({
      action: "block.save",
      date: "2026-10-23",
      time: "09:30",
      duration: "30",
    }),
    /overlap/,
  );
  await assert.rejects(
    save({
      action: "appointment.status",
      id: booking.id,
      version: 1,
      status: "cancelled",
    }),
    /changed/,
  );
  const cancelled = await save({
    action: "appointment.status",
    id: booking.id,
    version: booking.version,
    status: "cancelled",
  });
  assert.equal(
    sql
      .prepare("SELECT status FROM studio_appointments WHERE id=?")
      .get(booking.id).status,
    "cancelled",
  );
  await save({
    action: "block.save",
    date: "2026-10-23",
    time: "09:00",
    duration: "120",
  });
  await assert.rejects(
    save({
      action: "appointment.status",
      id: booking.id,
      version: cancelled.version,
      status: "confirmed",
    }),
    /overlap/,
  );
  assert.equal(
    sql.prepare("SELECT COUNT(*) n FROM studio_appointments").get().n,
    1,
  );
  assert.equal(
    sql.prepare("SELECT COUNT(*) n FROM studio_activity").get().n,
    5,
  );
  sql.close();
});
test("consent, waitlist and payment records persist; archive can be restored without losing history", async () => {
  const { sql, db } = database();
  const save = (raw) =>
    saveStudioCommand(parseStudioCommand(raw), db, "test-staff");
  const c = await save({
    action: "client.save",
    name: "Fictional client",
    email: "fictional@example.com",
    photoConsent: true,
  });
  assert.ok(
    sql.prepare("SELECT photo_consent_at FROM studio_clients").get()
      .photo_consent_at,
  );
  assert.equal(
    sql.prepare("SELECT marketing_consent_at FROM studio_clients").get()
      .marketing_consent_at,
    null,
  );
  await save({
    action: "waitlist.save",
    clientId: c.id,
    consent: true,
    notes: "Weekdays",
  });
  await assert.rejects(
    save({ action: "waitlist.save", clientId: c.id, consent: true }),
    /already exists/,
  );
  const s = await save({
    action: "service.save",
    name: "Example",
    price: "60",
    duration: "60",
    active: true,
  });
  const a = await save({
    action: "appointment.save",
    clientId: c.id,
    serviceId: s.id,
    date: "2026-10-23",
    time: "09:00",
  });
  await save({
    action: "payment.record",
    appointmentId: a.id,
    amountCents: 2000,
    method: "etransfer",
    reference: "Received by owner",
  });
  assert.equal(
    sql.prepare("SELECT amount_cents FROM studio_payments").get().amount_cents,
    2000,
  );
  const archived = await save({
    action: "record.archive",
    entity: "client",
    id: c.id,
    version: c.version,
  });
  assert.ok(
    sql.prepare("SELECT archived_at FROM studio_clients").get().archived_at,
  );
  await save({
    action: "record.restore",
    entity: "client",
    id: c.id,
    version: archived.version,
  });
  assert.equal(
    sql.prepare("SELECT archived_at FROM studio_clients").get().archived_at,
    null,
  );
  assert.equal(
    sql.prepare("SELECT COUNT(*) n FROM studio_appointments").get().n,
    1,
  );
  sql.close();
});
test("editing a profile preserves the original consent date until consent is withdrawn", async () => {
  const { sql, db } = database();
  const save = (r) =>
    saveStudioCommand(parseStudioCommand(r), db, "test-staff");
  const c = await save({
    action: "client.save",
    name: "Fictional client",
    phone: "4165550123",
    photoConsent: true,
  });
  const original = sql
    .prepare("SELECT photo_consent_at FROM studio_clients")
    .get().photo_consent_at;
  const edited = await save({
    action: "client.save",
    id: c.id,
    version: c.version,
    name: "Fictional client",
    phone: "4165550123",
    photoConsent: true,
    notes: "Updated preference",
  });
  assert.equal(
    sql.prepare("SELECT photo_consent_at FROM studio_clients").get()
      .photo_consent_at,
    original,
  );
  await save({
    action: "client.save",
    id: c.id,
    version: edited.version,
    name: "Fictional client",
    phone: "4165550123",
    photoConsent: false,
  });
  assert.equal(
    sql.prepare("SELECT photo_consent_at FROM studio_clients").get()
      .photo_consent_at,
    null,
  );
  sql.close();
});
test('manual enquiry conversion is unique and reports preserve booked price after service edits',async()=>{
 const{sql,db}=database();await initializeDatabase(db);const save=r=>saveStudioCommand(parseStudioCommand(r),db,'test-staff');
 const lead=await save({action:'lead.create',name:'Fictional lead',phone:'4165550188',consent:true,source:'Instagram',contactMethod:'text',notes:'Natural set'});
 const c=await save({action:'client.save',name:'Fictional lead',phone:'4165550188'});
 const s=await save({action:'service.save',name:'Structured gel',price:'65',duration:'90',active:true});
 const a=await save({action:'appointment.save',clientId:c.id,serviceId:s.id,leadId:lead.id,date:'2026-10-23',time:'09:00'});
 assert.equal(sql.prepare('SELECT status FROM booking_requests').get().status,'confirmed');
 await assert.rejects(save({action:'appointment.save',clientId:c.id,serviceId:s.id,leadId:lead.id,date:'2026-10-24',time:'09:00'}),/already exists/);
 await save({action:'service.save',id:s.id,version:s.version,name:'Structured gel',price:'80',duration:'90',active:true});
 await save({action:'appointment.status',id:a.id,version:a.version,status:'completed'});
 const snap=await studioSnapshot(db,'2026-10-23');assert.equal(snap.report.booking_value,6500);assert.equal(snap.report.completed,1);assert.equal(snap.paid.total,0);assert.equal(snap.attention.length,0);
 sql.close();
});
