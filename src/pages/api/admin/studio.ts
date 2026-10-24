import type { APIRoute } from "astro";
import {
  getStaffAccess,
  isSameOriginWrite,
  privateHeaders,
} from "../../../lib/auth";
import { ensureDatabase, getD1 } from "../../../lib/db";
import { initializeStudio } from "../../../lib/studio-schema";
import { saveStudioCommand, studioSnapshot } from "../../../lib/studio-store";
import {
  parseStudioCommand,
  StudioError,
} from "../../../lib/studio-validation";
import { torontoDate } from "../../../lib/crm";
export const prerender = false;
let initialized: Promise<void> | null = null;
export async function studioReady() {
  await ensureDatabase();
  initialized ??= initializeStudio(getD1()).catch((e) => {
    initialized = null;
    throw e;
  });
  await initialized;
}
async function handle(request: Request) {
  const json = (data: unknown, status = 200) =>
    Response.json(data, { status, headers: privateHeaders });
  const access = await getStaffAccess(request);
  if (!access.configured || !access.user)
    return json(
      {
        error: access.configured
          ? "Staff sign-in required."
          : "Staff access setup required.",
      },
      access.configured ? 401 : 503,
    );
  try {
    if (request.method === "GET") {
      const url = new URL(request.url),
        date = url.searchParams.get("date") || torontoDate();
      if (
        !/^20\d{2}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date + "T12:00Z")) ||
        new Date(date + "T12:00Z").toISOString().slice(0, 10) !== date
      )
        throw new StudioError("Invalid date.");
      const pageText = url.searchParams.get("page") || "1";
      if (!/^[1-9]\d{0,3}$/.test(pageText))
        throw new StudioError("Invalid page.");
      await studioReady();
      const data = await studioSnapshot(
        getD1(),
        date,
        url.searchParams.get("q") || "",
        Number(pageText),
      );
      const counts = await getD1()
        .prepare(
          "SELECT SUM(CASE WHEN status='pending' AND archived_at IS NULL THEN 1 ELSE 0 END) new_enquiries,SUM(CASE WHEN follow_up_date<=? AND status NOT IN ('completed','declined') AND archived_at IS NULL THEN 1 ELSE 0 END) follow_ups FROM booking_requests",
        )
        .bind(torontoDate())
        .first();
      const sources = await getD1().prepare("SELECT COALESCE(lead_source,'unknown') source,COUNT(*) total,SUM(CASE WHEN EXISTS(SELECT 1 FROM studio_appointments a WHERE a.lead_id=b.id AND a.status!='cancelled') THEN 1 ELSE 0 END) converted FROM booking_requests b GROUP BY COALESCE(lead_source,'unknown') ORDER BY total DESC").all();
      return json({
        ...data,
        sources: sources.results,
        counts,
        staff: access.user.email,
        integrations: {
          payments: false,
          email: false,
          sms: false,
          photos: false,
        },
        timezone: "America/Toronto",
        currency: "CAD",
      });
    }
    if (!isSameOriginWrite(request))
      return json({ error: "Invalid request origin." }, 403);
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new StudioError("Use a JSON request.");
    const reader = request.body?.getReader();
    if (!reader) throw new StudioError("Request body required.");
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        return json({ error: "Request is too large." }, 413);
      }
      chunks.push(value);
    }
    const raw = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(chunks.flatMap((c) => Array.from(c))),
      ),
    );
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new StudioError("Invalid request.");
    const command = parseStudioCommand(raw);
    await studioReady();
    return json({
      ok: true,
      ...(await saveStudioCommand(command, getD1(), access.user.email)),
    });
  } catch (error) {
    if (error instanceof StudioError)
      return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError)
      return json({ error: "Invalid JSON." }, 400);
    return json(
      {
        error:
          "The workspace is temporarily unavailable. Your changes have not been confirmed.",
      },
      503,
    );
  }
}
export const GET: APIRoute = ({ request }) => handle(request);
export const POST: APIRoute = ({ request }) => handle(request);
