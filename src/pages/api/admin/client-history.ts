import type { APIRoute } from "astro";
import { getStaffAccess, privateHeaders } from "../../../lib/auth";
import { getD1 } from "../../../lib/db";
import { studioReady } from "./studio";
import { uuid, StudioError } from "../../../lib/studio-validation";
export const prerender = false;
export const GET: APIRoute = async ({ request, url }) => {
  const json = (v: unknown, status = 200) =>
    Response.json(v, { status, headers: privateHeaders });
  const access = await getStaffAccess(request);
  if (!access.user)
    return json(
      { error: "Staff sign-in required." },
      access.configured ? 401 : 503,
    );
  try {
    const id = uuid(url.searchParams.get("id"));
    await studioReady();
    const appointments = await getD1()
      .prepare(
        "SELECT id,start_at,end_at,service_name,status,price_cents,notes FROM studio_appointments WHERE client_id=? ORDER BY start_at DESC LIMIT 100",
      )
      .bind(id)
      .all();
    return json({ appointments: appointments.results, limit: 100 });
  } catch (error) {
    return json(
      {
        error:
          error instanceof StudioError
            ? error.message
            : "History is temporarily unavailable.",
      },
      error instanceof StudioError ? 400 : 503,
    );
  }
};
