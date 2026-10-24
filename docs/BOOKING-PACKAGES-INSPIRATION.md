# Guided appointment requests

Status: dependent draft PR #8, integrated with pricing PR #7. The proposed catalogue is not approved for publication. No production merge, deployment, database change or real notification has been performed for this feature.

## Client journey

1. **Time:** choose an available two-hour weekday block, Toronto time.
2. **Service:** choose a package, applicable length and art level. “Not sure — help me choose” is valid without a numeric price. Shape, reconstruction and repairs are collapsed under optional additional needs.
3. **Your details:** review the estimate, leave name/phone/call-or-text preference and consent. Inspiration links/images are optional here, with no separate required step. Back navigation and dialog reopening preserve the draft in memory.

Selecting a time does not reserve capacity. Successful final submission atomically holds the day for Bianca's review. Bianca confirms service suitability, final price, timing and visit details before the appointment is confirmed.

## One proposed catalogue

`src/data/pricing.ts` owns manicure, fill, maintenance, length, art, repair, reconstruction and removal amounts. Stable service/repair IDs connect booking options to this source. The pricing page and booking estimate use the same maintenance and reconstruction entries; Tier 2 is named Elevated. Durations shown on the pricing page come from the supplied proposed menu, not from public availability slots.

Fill prices already include length. Reconstruction and individual repairs cannot charge for the same work. Bespoke/unknown options need consultation; estimates are CAD before applicable taxes. The server ignores submitted totals and computes a stored snapshot. Unknown services receive no invented zero-dollar price.

Private CRM services are separately configured by authorised staff; no draft prices are seeded into production. For a public request with a selection snapshot, staff must enter the agreed price including extras when creating the appointment. Rescheduling the same service preserves that saved price if no replacement price is supplied. An explicit staff-entered price may reflect a different agreed quote after consultation. No payment is collected by these controls.

## Request, inspiration and privacy

- Three public HTTPS links maximum; links are validated but never fetched automatically.
- Two optional images maximum. Browser preparation resizes to 1,400px JPEG without retaining original metadata; server permits bounded JPEG/PNG files, 300 KB each, and a streamed 700 KB total body limit. Raster signatures, marker/frame metadata, dimensions and duplicate JPEG frame headers are checked. SVG/HTML are rejected.
- Small private image blobs are stored separately in D1 and kept out of normal inbox lists. No public image bucket or third-party media service is introduced.
- Held request, service snapshot, links and image rows save in one D1 transaction. Invalid/stale requests do not create partial holds or orphan attachments. Daily hashed network limits, honeypot and phone duplicate checks remain.
- Staff detail/image APIs authenticate before database access. Images use private/no-store, no-referrer, nosniff and restrictive CSP headers. Public availability and calendar feed never expose inspiration or personal details.
- Notifications contain the computed service summary and attachment counts, pointing to the protected staff workspace. They do not email image bytes or inspiration URLs. If the notification sender fails, the request remains saved; immediate duplicate retries do not send a second notification. Provider failure is logged by request ID. Actual inbox delivery remains unverified.
- JSON export includes selection snapshots, estimates, links and image metadata. Image binaries are explicitly excluded in both export metadata and staff copy; this is not a complete database backup or tested restore.
- Inspiration is private operational material, not permission to publish client images or send marketing. Retention follows the related enquiry; archive does not erase it.

## Measurement

The optional existing Plausible hook emits one view event per draft step: `booking_step_time_viewed`, `booking_step_service_viewed`, `booking_step_details_viewed`. No contact details, filenames or inspiration URLs are included. No analytics account/provider is activated by this change, and no conversion improvement is claimed.

## Verification

- 64 Node tests pass; Astro check has zero errors/warnings/hints; production build passes.
- Real multipart request handler exercised against SQLite through a D1 adapter, with a mock notification sender. Verified server-calculated $105 estimate, private image/details retrieval, duplicate retry, competing day conflict, invalid upload, production draft gate, unknown-service consultation and provider-outage persistence.
- Full synthetic lifecycle: submit → retrieve selections/images → explicitly agree $105 → create a two-hour appointment → change configured service price → move the appointment to a different date without repricing → cancel. Verified old/new day availability and retained request attachments.
- Browser: three-step journey, help-me-choose, $105 estimate, optional controls, link errors and responsive widths 320/768/1024/1440. New maintenance/reconstruction pricing and staff conversion price controls reviewed visually; narrow pricing content has no horizontal overflow.
- The staff preview uses fictional demo data. No valid production/client request, real email or payment was created for QA.

## Release gates and rollback

1. Bianca/Cameron: confirm the supplied proposed menu as final public rates and approve service scope, durations and policies. `pricingDraft.approved` remains false; production pricing route and new request POST fail closed while unapproved.
2. Reconcile any final owner amendments, re-review the combined diff, then explicitly authorise merging/deployment of PRs #7/#8.
3. Verify authenticated staff retrieval and actual delivery to Bianca's inbox with an authorised identifiable test request after release. The local mocked-sender test does not prove inbox delivery.
4. Configure an approved analytics account if real funnel measurement is wanted.

The additive D1 tables initialise through the existing migration path. Preserve Access restrictions and client data. Roll back application commits while retaining new tables and records; do not drop attachments as part of rollback.
