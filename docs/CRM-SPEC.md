# CRM first release

Build a small staff-only enquiry CRM for La La Land on Astro and Cloudflare D1. Existing appointment enquiries remain the records of truth; no unrelated client data, payment provider, bulk email, or automatic outreach is included.

Assumptions: Cameron and Bianca are the intended staff; each appointment request is an enquiry record with its own name/contact details. A deduplicated client directory and appointment calendar are later increments. Keep the public callback form unchanged.

## Modules and build order

1. `staff-access`: validate Cloudflare Access JWT signature, issuer, audience, expiry, subject and staff email allowlist. Never trust caller-provided identity headers. All CRM routes fail closed before database reads when access is not configured or invalid.
2. `enquiry-crm`: depends on staff-access. Search/filter/paginate enquiries; edit status/private note/follow-up date; archive and restore. No permanent-delete action. Store optional follow-up/archive fields with additive migration only; preserve existing enquiries.

## Acceptance

- /admin and /api/admin/* require verified staff identity; API/page responses are private, no-store and noindex.
- Missing Access configuration yields 503 without reading the database. Missing/invalid/nonstaff identity yields 401/403 without reading data.
- Reject cross-origin writes. Validate IDs, statuses, note length, dates, version and pagination before SQL execution.
- Search and count the same filtered dataset; bounded pages of at most 50 records. SQL parameters are bound.
- Set/clear follow-up date as a Toronto calendar date. Detect stale writes rather than silently overwriting another staff edit.
- Archiving hides records from the active inbox and is reversible. Existing legacy delete requests cannot permanently erase data.
- Public callback requests continue saving with no new required fields.

## Implementation and checks

Keep source in src/lib, src/pages/admin and src/pages/api/admin; schema in db/schema.ts, initialization in src/lib/db.ts, Node tests in tests. Use existing TypeScript/Astro patterns, escaped output and parameterized Drizzle/D1 operations. jose handles standard JWT verification; no custom cryptography.

Commands: `node --test tests/*.test.mjs`, `npm run check`, `npm run build`. Verify auth with locally signed test tokens, rejection cases, validation and SQLite migration/update behaviour. Browser QA at 390/768/1440px and live staff sign-in require an available browser and configured Access application.

## Deployment boundary

Deploy the implementation locked by default. To enable staff use, create a Cloudflare Access application protecting BOTH lalalandnails.ca/admin* and lalalandnails.ca/api/admin/*, allow only approved staff emails, and configure ACCESS_TEAM_DOMAIN (team.cloudflareaccess.com), ACCESS_AUD and CRM_ADMIN_EMAILS in Worker environment settings. The public homepage and /api/bookings must remain public. Team domain and AUD are configuration, not passwords. Do not commit tokens or client data.

Cloudflare account controls are not currently available through the connected tools; that setup cannot be claimed complete. Existing legacy Sites sign-in is not a secure fallback. Rollback by reverting the focused commit; additive columns may remain and hold data without affecting the preceding public booking form.
