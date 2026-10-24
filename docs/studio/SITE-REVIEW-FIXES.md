# Site review fixes

Scope: the agent review and request to make appointment CTAs open a popup, followed by “Fix all.”

## Implemented

- All same-page appointment CTAs open a native dialog. Modified clicks and unsupported browsers keep anchor navigation. The original single form moves into the dialog and returns home on close, preserving drafts and handlers.
- Native modal focus containment, Escape, explicit close, outside-click close, background scroll lock, visible close control, and focus return (including hidden mobile menu CTA fallback).
- Compact mobile form with 16px inputs; the inline form comes before the introduction/image on mobile. No preferred-day fields.
- Shared public/CRM phone normalization. Invalid and unsupported numbers are rejected consistently; a SQLite regression test covers formatted legacy duplicates.
- Field-specific, associated validation errors and focus on the first invalid field. Duplicate submits are blocked while pending. Non-JSON failures use ordinary retry copy and keep drafts.
- Shorter service copy, clearer process steps and a more informative bio using existing approved facts. AI inspiration remains labelled.
- Public privacy notice linked at collection and in the footer. Notification wording reflects attempted delivery rather than a guarantee.
- General lead-source labels persisted with new enquiries and manual staff enquiries. CRM enquiry details and all-time source report show counts and linked bookings. These are channel hints, not verified attribution or a conversion-rate claim. Full referrer URLs, search terms and campaign IDs are not stored.
- Additive nullable lead_source column; existing records remain unchanged and unknown. Calendar paths disallowed in robots; token authorization remains essential.
- Decorative motion reinitializes after Back/BFCache restoration; optional chat input uses 16px type.
- README and launch checklist updated to the actual Cloudflare deployment/indexing state.

## Verification

33 Node tests pass; Astro check reports zero diagnostics; production build passes. Browser checks covered desktop and responsive frames at 320, 768, 1024 and 1440px, including popup open/close, Escape, preserved draft, invalid phone error/focus, mobile menu focus return and horizontal fit. Privacy route renders. This does not replace physical-device or full assistive-technology testing.

No real enquiry or notification was sent. Authenticated production CRM source reporting and calendar subscription remain staff verification steps. External analytics is not activated; a Plausible site/account is not configured.

## Business input still needed

No approved values were found in current project records. These cannot be completed truthfully by changing code alone:

- Starting prices, appointment length, exact inclusions and removal/fill/repair scope.
- Public fallback phone/email, hours, response-time expectation, visit logistics and cancellation/late-arrival policies.
- Google Business Profile and public social links.
- Substantive verified credentials and authentic client reviews/portfolio with permission. AI-only imagery remains the current user preference.
- Approved analytics property and access if external funnel analytics is wanted.

The internal notification inbox is not a public contact approval. Competitor pricing in historical research is not La La Land pricing. No invented reviews, credentials, hours or service prices were published.
