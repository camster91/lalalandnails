import type { APIRoute } from "astro";
import { getStaffAccess, privateHeaders } from "../../../lib/auth";
import { getD1 } from "../../../lib/db";
import { studioReady } from "./studio";
export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  const json = (v: unknown, status = 200) =>
    Response.json(v, { status, headers: privateHeaders });
  const access = await getStaffAccess(request);
  if (!access.user)
    return json(
      { error: "Staff sign-in required." },
      access.configured ? 401 : 503,
    );
  try {
    await studioReady();
    const entities = {
      client: "studio_clients",
      service: "studio_services",
      block: "studio_blocks",
      waitlist: "studio_waitlist",
    };
    const result: Record<string, unknown> = {};
    for (const [key, table] of Object.entries(entities))
      result[key] = (
        await getD1()
          .prepare(
            `SELECT * FROM ${table} WHERE archived_at IS NOT NULL ORDER BY archived_at DESC LIMIT 200`,
          )
          .all()
      ).results;
    return json(result);
  } catch {
    return json(
      { error: "Archived records are temporarily unavailable." },
      503,
    );
  }
};
