# Enable the staff CRM

The backend is locked by default. Public site visitors can request appointments; only verified, allowlisted staff may open enquiry records. No client messaging is sent by CRM edits or follow-up dates.

## Cloudflare setup

1. In the existing Cloudflare account, configure a self-hosted Access application protecting both `lalalandnails.ca/admin*` and `lalalandnails.ca/api/admin/*`. Use one application/audience for both path groups. Enable an appropriate sign-in method and an explicit policy for the approved staff emails. Do not protect the public homepage or `/api/bookings`.
2. In the lalalandnails Worker environment settings set `ACCESS_TEAM_DOMAIN` to the team hostname (for example `your-team.cloudflareaccess.com`), `ACCESS_AUD` to the application's audience tag, and `CRM_ADMIN_EMAILS` to the comma-separated approved staff addresses. Do not use a wildcard or an email domain as the staff allowlist. No password or JWT belongs in GitHub.
3. Open `/admin` in a private browser window. Confirm Access prompts for sign-in, permitted staff can enter, a nonstaff account is denied, and a direct request to the workers.dev endpoint without a valid token is denied.
4. Verify both page and API routes are protected. The app independently checks the signed token and allowlist, so edge-policy mistakes do not provide an identity-header bypass. The previous Sites identity headers no longer authorize CRM access.

Missing application configuration returns 503; unauthenticated/unapproved requests return 401. CRM responses use private/no-store/noindex headers. Cloudflare Access was configured on 2026-10-23 for the exact `/admin`, `/admin/*` and `/api/admin/*` paths on the root and www domains. Email-code sign-in is restricted to the two approved staff addresses. Team domain, audience and staff allowlist are Worker secret bindings. The public homepage returns 200; protected page/API requests redirect to Cloudflare Access; public form validation remains accessible. Successful staff sign-in and authorized edits still require an authenticated live test.

## API

- `GET /api/admin/bookings?q=&status=&view=active&page=1`: 25 records per page. `view` supports active, due, archived. Status supports pending, contacted, confirmed, declined, completed. Searches name, stored phone or email as a literal substring. A normalized/deduplicated contact directory is not implemented yet.
- `PATCH /api/admin/bookings/{uuid}`: authenticated, same-origin JSON. Update example with fictional values: `{ "action": "update", "updatedAt": 1234567890000, "status": "contacted", "adminNote": "Discuss preferred colour", "followUpDate": "2026-11-02" }`.
- Archive/restore: `{ "action": "archive", "updatedAt": 1234567890000 }` or action restore. Send the record's current updatedAt; use the returned version for the next write.
- Empty followUpDate clears the reminder. Dates are Toronto calendar dates; they do not schedule outbound notifications. Notes are limited to 500 characters. No permanent-delete action is supported.
- A stale/nonexistent record returns 409; refresh before retrying. Malformed IDs/updates return 400. There is no public API token or permissive CORS configuration.

## Persistence and verification

The existing D1 `booking_requests` table gains nullable `follow_up_date` and `archived_at` columns and an index. Initialization is additive/idempotent, retries after errors, and runs on the next database access. No production records were exported, modified or deleted during development. Migration/query/update behaviour was tested on actual SQLite using a small D1-compatible adapter. On 2026-10-23 the production D1 schema was also migrated additively: contact_method, follow_up_date, archived_at and the follow-up index were verified. Record counts were unchanged; no enquiry contents were read.

Run `node --test tests/*.test.mjs`, `npm run check`, `npm run build`. API authorization is checked before database initialization or queries. Live authorized CRUD, Access login, customer notification delivery and responsive browser QA still require verification. Use clearly marked test data only after an approved live test can be reconciled by the owner.

Rollback the focused CRM commit if necessary. Additive columns can remain; rollback does not remove saved data. Re-enabling the former identity-header login is unsafe on an unprotected standalone Worker, so preserve the new access guard if rolling back CRM UI behaviour.

Official guidance: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ and https://github.com/panva/jose
