# Guided booking requests — dependent draft

Status: implemented on a separate branch stacked on pricing PR #7. Do not merge or deploy until the Services & Pricing catalogue and proposed reconstruction/maintenance options are approved. No production data or infrastructure changed by this feature.

## Client flow — simplified for CRO

1. Choose an available two-hour weekday block in Toronto time.
2. Choose a package, length where applicable, and art level. “Not sure — help me choose” is a valid route with no invented price. Unknown length/art retains only a starting estimate. Shape, repairs and reconstruction sit under a collapsed **Additional needs — optional** disclosure. Fill prices include length; repairs and reconstruction cannot double charge.
3. Review the time and estimate, provide name/phone/call-or-text consent, and optionally expand **Add inspiration** for links or images. Inspiration is no longer a separate required step. A final submission holds the day; selecting a time alone does not reserve capacity.

Step-view events (`booking_step_time_viewed`, `booking_step_service_viewed`, `booking_step_details_viewed`) are emitted once per draft through the existing optional Plausible hook. No contact data, filenames or inspiration URLs enter those events. No analytics provider is activated here; conversion/abandonment measurement needs that existing integration configured. No conversion lift is claimed.

## Storage and staff review

- Server validates options and recomputes price; client-supplied totals are ignored. A snapshot is saved, preserving the original estimate when prices change later.
- Streamed body limit: 700 KB including multipart overhead. At most two JPEG/PNG files of 300 KB each; validate signatures, JPEG marker/dimension metadata and raster dimensions. SVG/HTML are rejected. Existing daily network rate limit, honeypot, phone duplicate protection and database capacity constraints remain.
- Small image blobs live in a separate D1 table, outside normal inbox/list queries. No R2 bucket, public image route, third-party media host or extra credentials are needed for this bounded feature.
- The held day, selection snapshot, links and image rows commit in one D1 batch. Failed image/detail inserts roll back the reservation.
- Staff enquiry dialog loads service selections, estimate, safe external links and private image previews. Every detail/image request verifies Access before database access. Images have no-store/no-referrer/nosniff and restrictive CSP headers.
- Notifications contain a service summary and attachment counts, pointing to the protected workspace; image bytes and user inspiration URLs are not emailed.
- Public availability and calendar feeds never include inspiration, images, selection details or contact information.
- JSON export includes selections, estimates, links and image metadata. **Image bytes are excluded** and this is explicit in export metadata and staff UI; this is not a complete backup or tested restore. Full attachment export is a future increment.
- Inspiration is private operational material, not portfolio permission or marketing consent. Retention follows enquiry records; archiving does not erase images. Existing privacy notice updated.

## Release and rollback

PR #7 is actively changing. Retarget/rebase this dependent branch after its final catalogue is approved. In particular, move the supplied maintenance and reconstruction options into the canonical approved price catalogue before release, and reconcile package IDs/names/amounts with that final source. The production POST fails closed while `pricingDraft.approved` is false.

Acceptance: complete 3-step flow; correct estimates and no double charges; optional links and images survive navigation; invalid files/URLs handled; staff-only retrieval; no privacy leak in availability/feed; atomic rollback; mobile/tablet/desktop layout and keyboard focus. Tests cover pure policy, body bounds/multipart parsing, real SQLite transaction/capacity and attachment rollback. No real client request or email sent for QA.

Deployment: additive D1 tables initialize through existing migration code. Preserve Access restrictions. Roll back application changes while retaining attachment tables/records; never drop client inspiration as part of rollback. Staff live authenticated retrieval and notification delivery must be verified separately after authorised release.

## Verification recorded

- 55 Node tests pass; Astro check: zero errors/warnings/hints; production build passes.
- Earlier four-step verification: desktop time→service→inspiration→review flow; $105 structured/medium/Tier 2 calculation; $80 medium fill; JPEG preparation from a WebP reference and preview; link validation; missing contact/consent feedback; back navigation and dialog reopening preserve fields. No valid form was submitted.
- Layout widths 320, 768, 1024 and 1440: no horizontal overflow in page or modal; 320px service screen visually inspected. Native keyboard/focus behaviour retained with step heading focus and explicit Back/Continue controls.
- Security review addressed JPEG marker/dimension limits, duplicate frame-header regression and transparent export exclusions. Private staff retrieval is implemented but not tested with a live authenticated enquiry. Full image clipboard paste is implemented; file chooser upload was exercised.

## CRO simplification verification

Added regression tests for help-me-choose requests with no numeric price and unknown length/art starting estimates. Mobile, tablet and desktop QA covers the three-step journey, collapsed optional controls, final-step inspiration validation, back navigation and preserved estimates. Production release still depends on PR #7 approval; no deployment or merge is included in this update.

CRO update verification: 57 tests passed; Astro check and build passed. Browser checked 320/768/1024/1440 widths, unknown-service continuation without a price, $105 known-service estimate, collapsed extras, combined details/inspiration step and unsafe-link errors. No valid client request or notification sent.
