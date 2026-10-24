import {
  StudioError,
  torontoInstant,
  type StudioCommand,
} from "./studio-validation.ts";
export async function saveStudioCommand(
  c: StudioCommand,
  db: D1Database,
  actor: string,
) {
  const id = c.id ?? crypto.randomUUID(),
    now = Math.max(Date.now(), (c.version ?? 0) + 1);
  let mutation: D1PreparedStatement;
  const insert = (table: string, cols: string[], values: unknown[]) =>
    db
      .prepare(
        `INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
      )
      .bind(...values);
  const update = (table: string, cols: string[], values: unknown[]) =>
    db
      .prepare(
        `UPDATE ${table} SET ${cols.map((x) => `${x}=?`).join(",")} WHERE id=? AND version=?`,
      )
      .bind(...values, id, c.version);
  switch (c.action) {
    case "lead.create":
      mutation = insert(
        "booking_requests",
        [
          "id",
          "created_at",
          "updated_at",
          "name",
          "phone",
          "contact_method",
          "lead_source",
          "preferred_date",
          "preferred_time",
          "notes",
          "consent_at",
        ],
        [
          id,
          now,
          now,
          c.name,
          c.phone,
          c.contactMethod,
          c.source.toLowerCase(),
          "",
          "",
          `Source: ${c.source}\n${c.notes}`,
          now,
        ],
      );
      break;
    case "client.save": {
      const cols = [
        "version",
        "name",
        "phone",
        "email",
        "notes",
        "preferences",
        "sensitivities",
        "marketing_consent_at",
        "photo_consent_at",
      ];
      const values = [
        now,
        c.name,
        c.phone,
        c.email,
        c.notes,
        c.preferences,
        c.sensitivities,
        c.marketingConsent ? now : null,
        c.photoConsent ? now : null,
      ];
      mutation = c.id
        ? db
            .prepare(
              "UPDATE studio_clients SET version=?,name=?,phone=?,email=?,notes=?,preferences=?,sensitivities=?,marketing_consent_at=CASE WHEN ? THEN COALESCE(marketing_consent_at,?) ELSE NULL END,photo_consent_at=CASE WHEN ? THEN COALESCE(photo_consent_at,?) ELSE NULL END WHERE id=? AND version=?",
            )
            .bind(
              now,
              c.name,
              c.phone,
              c.email,
              c.notes,
              c.preferences,
              c.sensitivities,
              c.marketingConsent ? 1 : 0,
              now,
              c.photoConsent ? 1 : 0,
              now,
              id,
              c.version,
            )
        : insert(
            "studio_clients",
            ["id", "created_at", ...cols],
            [id, now, ...values],
          );
      break;
    }
    case "service.save": {
      const cols = [
        "version",
        "name",
        "category",
        "description",
        "price_cents",
        "duration",
        "buffer",
        "active",
      ];
      const values = [
        now,
        c.name,
        c.category,
        c.description,
        c.priceCents,
        c.duration,
        c.buffer,
        c.active ? 1 : 0,
      ];
      mutation = c.id
        ? update("studio_services", cols, values)
        : insert("studio_services", ["id", ...cols], [id, ...values]);
      break;
    }
    case "appointment.save": {
      const service = await db
        .prepare(
          "SELECT * FROM studio_services WHERE id=? AND active=1 AND archived_at IS NULL",
        )
        .bind(c.serviceId)
        .first<{
          name: string;
          duration: number;
          buffer: number;
          price_cents: number;
        }>();
      const client = await db
        .prepare(
          "SELECT id FROM studio_clients WHERE id=? AND archived_at IS NULL",
        )
        .bind(c.clientId)
        .first();
      if (!service || !client)
        throw new StudioError(
          "Choose an active client and a configured service.",
        );
      if (c.leadId) {
        const lead = await db
          .prepare(
            "SELECT id FROM booking_requests WHERE id=? AND archived_at IS NULL",
          )
          .bind(c.leadId)
          .first();
        if (!lead) throw new StudioError("This enquiry is unavailable.", 409);
      }
      const cols = [
        "version",
        "client_id",
        "service_id",
        "start_at",
        "end_at",
        "blocked_until",
        "service_name",
        "price_cents",
        "notes",
      ];
      const values = [
        now,
        c.clientId,
        c.serviceId,
        c.start,
        c.start + service.duration * 60000,
        c.start + (service.duration + service.buffer) * 60000,
        service.name,
        service.price_cents,
        c.notes,
      ];
      mutation = c.id
        ? update("studio_appointments", cols, values)
        : insert(
            "studio_appointments",
            ["id", "lead_id", ...cols],
            [id, c.leadId, ...values],
          );
      break;
    }
    case "appointment.status":
      mutation = update(
        "studio_appointments",
        ["version", "status"],
        [now, c.status],
      );
      break;
    case "block.save": {
      const cols = ["version", "start_at", "end_at", "label"];
      const vals = [now, c.start, c.end, c.label];
      mutation = c.id
        ? update("studio_blocks", cols, vals)
        : insert("studio_blocks", ["id", ...cols], [id, ...vals]);
      break;
    }
    case "waitlist.save": {
      const client = await db
        .prepare(
          "SELECT id FROM studio_clients WHERE id=? AND archived_at IS NULL",
        )
        .bind(c.clientId)
        .first();
      if (!client) throw new StudioError("Choose an active client.");
      mutation = c.id
        ? update(
            "studio_waitlist",
            ["version", "client_id", "service_id", "notes", "consent_at"],
            [now, c.clientId, c.serviceId, c.notes, now],
          )
        : insert(
            "studio_waitlist",
            ["id", "version", "client_id", "service_id", "notes", "consent_at"],
            [id, now, c.clientId, c.serviceId, c.notes, now],
          );
      break;
    }
    case "record.archive":
    case "record.restore": {
      const tables = {
        client: "studio_clients",
        service: "studio_services",
        block: "studio_blocks",
        waitlist: "studio_waitlist",
      };
      mutation = update(
        tables[c.entity as keyof typeof tables],
        ["version", "archived_at"],
        [now, c.action === "record.restore" ? null : now],
      );
      break;
    }
    case "payment.record":
      mutation = insert(
        "studio_payments",
        [
          "id",
          "created_at",
          "appointment_id",
          "amount_cents",
          "method",
          "reference",
        ],
        [id, now, c.appointmentId, c.amountCents, c.method, c.reference],
      );
      break;
  }
  const audit = db
    .prepare(
      "INSERT INTO studio_activity(id,created_at,actor,action,record_id) SELECT ?,?,?,?,? WHERE changes()>0",
    )
    .bind(crypto.randomUUID(), now, actor, c.action, id);
  try {
    const statements = [mutation!, audit];
    if (c.action === "appointment.save" && c.leadId && !c.id)
      statements.push(
        db
          .prepare(
            "UPDATE booking_requests SET status='confirmed',updated_at=? WHERE id=?",
          )
          .bind(now, c.leadId),
      );
    const result = await db.batch(statements);
    if (!result[0].meta.changes)
      throw new StudioError(
        "This record changed or is unavailable. Refresh before trying again.",
        409,
      );
    return { id, version: now };
  } catch (error) {
    if (error instanceof StudioError) throw error;
    const message = String(error);
    if (message.includes("studio_overlap"))
      throw new StudioError(
        "This time overlaps an appointment, buffer or blocked time.",
        409,
      );
    if (message.includes("UNIQUE"))
      throw new StudioError(
        "A matching record already exists. Select it instead of creating a duplicate.",
        409,
      );
    if (message.includes("FOREIGN KEY"))
      throw new StudioError("The linked record is unavailable.", 409);
    throw error;
  }
}
export async function studioSnapshot(
  db: D1Database,
  date: string,
  query = "",
  page = 1,
) {
  const all = async (sql: string, ...args: unknown[]) =>
    (
      await db
        .prepare(sql)
        .bind(...args)
        .all()
    ).results;
  // Calendar month and client pagination are bounded; dashboard totals use independent COUNT queries.
  const month = date.slice(0, 7);
  const start = torontoInstant(month + "-01", "00:00");
  const next = new Date(month + "-01T12:00Z");
  next.setUTCMonth(next.getUTCMonth() + 1);
  const end = torontoInstant(next.toISOString().slice(0, 10), "00:00");
  const q = query.trim().slice(0, 80);
  const clients = await all(
    "SELECT * FROM studio_clients WHERE archived_at IS NULL AND (instr(lower(name),lower(?))>0 OR instr(phone,?)>0 OR instr(lower(email),lower(?))>0) ORDER BY name,id LIMIT 50 OFFSET ?",
    q,
    q,
    q,
    (page - 1) * 50,
  );
  const clientCount = await db
    .prepare(
      "SELECT COUNT(*) total FROM studio_clients WHERE archived_at IS NULL AND (instr(lower(name),lower(?))>0 OR instr(phone,?)>0 OR instr(lower(email),lower(?))>0)",
    )
    .bind(q, q, q)
    .first();
  const appointments = await all(
    `SELECT a.*,c.name client_name,c.phone,c.email FROM studio_appointments a JOIN studio_clients c ON c.id=a.client_id WHERE a.start_at>=? AND a.start_at<? ORDER BY start_at,id LIMIT 1000`,
    start,
    end,
  );
  const attention = await all(
    "SELECT id,name,phone,email,contact_method contactMethod,lead_source leadSource,notes,status,created_at createdAt,updated_at updatedAt,admin_note adminNote,follow_up_date followUpDate FROM booking_requests WHERE archived_at IS NULL AND (status='pending' OR (follow_up_date<=? AND status NOT IN ('completed','declined','confirmed'))) ORDER BY CASE WHEN follow_up_date<=? THEN 0 ELSE 1 END,created_at DESC LIMIT 10",
    date,
    date,
  );
  const report = await db
    .prepare(
      "SELECT COUNT(*) completed,COALESCE(SUM(price_cents),0) booking_value FROM studio_appointments WHERE status='completed' AND start_at>=? AND start_at<?",
    )
    .bind(start, end)
    .first();
  const serviceReport = await all(
    "SELECT service_name,COUNT(*) completed,SUM(price_cents) booking_value FROM studio_appointments WHERE status='completed' AND start_at>=? AND start_at<? GROUP BY service_name",
    start,
    end,
  );
  const paid = await db
    .prepare(
      "SELECT COALESCE(SUM(amount_cents),0) total FROM studio_payments WHERE created_at>=? AND created_at<?",
    )
    .bind(start, end)
    .first();

  return {
    date,
    clients,
    clientCount,
    clientPage: page,
    attention,
    report,
    serviceReport,
    paid,
    services: await all(
      "SELECT * FROM studio_services WHERE archived_at IS NULL ORDER BY category,name",
    ),
    appointments,
    blocks: await all(
      "SELECT * FROM studio_blocks WHERE archived_at IS NULL AND end_at>? AND start_at<? ORDER BY start_at LIMIT 1000",
      start,
      end,
    ),
    waitlist: await all(
      "SELECT w.*,c.name client_name FROM studio_waitlist w JOIN studio_clients c ON c.id=w.client_id WHERE w.archived_at IS NULL ORDER BY consent_at LIMIT 250",
    ),
    payments: await all(
      "SELECT * FROM studio_payments WHERE created_at>=? AND created_at<? ORDER BY created_at LIMIT 2000",
      start,
      end,
    ),
    activity: await all(
      "SELECT * FROM studio_activity ORDER BY created_at DESC LIMIT 40",
    ),
  };
}
