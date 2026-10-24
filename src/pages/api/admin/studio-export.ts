import type { APIRoute } from "astro";
import {
  getStaffAccess,
  isSameOriginWrite,
  privateHeaders,
} from "../../../lib/auth";
import { getD1 } from "../../../lib/db";
import { studioReady } from "./studio";
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const json = (v: unknown, status = 200) =>
    Response.json(v, { status, headers: privateHeaders });
  const access = await getStaffAccess(request);
  if (!access.user)
    return json(
      { error: "Staff sign-in required." },
      access.configured ? 401 : 503,
    );
  if (!isSameOriginWrite(request))
    return json({ error: "Invalid request origin." }, 403);
  try {
    await studioReady();
    const db = getD1(),
      tables = [
        "studio_clients",
        "studio_services",
        "studio_appointments",
        "studio_blocks",
        "studio_waitlist",
        "studio_payments",
        "studio_activity",
        "studio_photos",
        "booking_requests",
        "booking_request_details",
        "booking_inspiration",
      ];
    // One transaction provides a consistent export. Refuse oversized snapshots rather than silently truncating.
    const count = await db.batch(
      tables.map((t) => db.prepare(`SELECT COUNT(*) total FROM ${t}`)),
    );
    if (
      count.some(
        (r) => Number((r.results[0] as { total: number }).total) > 10000,
      )
    )
      return json(
        {
          error:
            "This workspace needs a paginated export. Contact the administrator.",
        },
        413,
      );
    const rows = await db.batch(
      tables.map((t) => db.prepare(`SELECT ${t === "booking_inspiration" ? "id,request_id,mime,created_at" : "*"} FROM ${t} LIMIT 10001`)),
    );
    if (rows.some((r) => r.results.length > 10000))
      return json({ error: "Export limit exceeded." }, 413);
    const output = {
      format: "lalaland-studio-v1",
      limitations: ["Inspiration image bytes are excluded. Image metadata, service selections, estimates and links are included. This is not a complete database backup."],
      createdAt: new Date().toISOString(),
      timezone: "America/Toronto",
      tables: Object.fromEntries(tables.map((t, i) => [t, rows[i].results])),
    };
    await db
      .prepare(
        "INSERT INTO studio_activity(id,created_at,actor,action,record_id) VALUES(?,?,?,?,?)",
      )
      .bind(
        crypto.randomUUID(),
        Date.now(),
        access.user.email,
        "studio.export",
        "workspace",
      )
      .run();
    return new Response(JSON.stringify(output, null, 2), {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/json",
        "Content-Disposition":
          'attachment; filename="lalaland-studio-export.json"',
      },
    });
  } catch {
    return json({ error: "Export could not be created." }, 503);
  }
};
