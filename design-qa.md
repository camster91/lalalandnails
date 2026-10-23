# Studio Today design QA

final result: passed

Scope: selected visual direction and the implemented operational core. This does not certify unimplemented Stripe, public scheduling, messaging, media or marketing integrations.

## Evidence

- Visual truth: first displayed generated option; original `generated_images/exec-3b3cac59-eba6-433b-8f25-202cb958484e.png` (853 × 1844). Repository reference: `src/assets/studio-selected.webp`, same dimensions, compressed solely for the comparison harness.
- Rendered comparison: `http://terminal.local:4173/studio-review?size=mobile&compare=1`; source and running implementation were captured together in one browser screenshot. Screenshot is in the conversation tool output; the browser did not return a filesystem screenshot path.
- Mobile outer frame 390 × 844 CSS px; content width 375 with native vertical scrollbar. Source displayed at 375 × 810 to preserve its aspect ratio. No stretching. This explains the small overall height difference; the source is a raster concept rather than a browser capture.
- Tablet: 768 outer frame, 753 content width. Desktop: 1363 browser viewport, responsive layout capped at 1440. Both inspected in the cloud browser. No horizontal content overflow was observed on mobile/tablet.
- State: fresh demo Today view, 2026-10-23, three fictional appointments, two new enquiries and one follow-up. Demo names/appointments are excluded from production JavaScript and are never seeded in D1.

## Comparison history

1. Initial mobile implementation placed attention records too far below the first viewport and wrapped the appointments section heading. P2.
2. Reduced mobile header, section-heading scale, stats spacing and row padding; kept readable 16px inputs and usable actions. Re-captured the same mobile state alongside the reference.
3. Attention rows still consumed too much vertical space. P2. Tightened metadata line height and removed redundant line breaks; ellipsised the short preview only. Full notes remain in the enquiry dialog.
4. Final side-by-side capture shows all three appointments, both attention rows and persistent navigation within the mobile frame. No outstanding actionable P0/P1/P2 visual findings.

## Required surfaces

- Typography: existing Fraunces and DM Sans fonts retained. Display headings are restrained, with readable body/control sizes. Regional date formatting intentionally uses en-CA.
- Rhythm/layout: compact header, inline totals, blush date strip, separated appointment rows, attention rows and bottom navigation reproduce the selected hierarchy. Desktop uses a sidebar and two columns.
- Tokens: burgundy #330505, paper #fffaf5, cream #fff0c8, blush #ffc9da/related light tint. Status uses a muted green with readable text.
- Assets: the concept uses editable UI wordmark/initials, not photographic assets. Phosphor supplies standard icons; no hand-drawn replacement icons or fake nail photography. Full-view evidence is legible enough to inspect wordmark, headings, row alignment, status and navigation; focused inspection also used rendered DOM measurements.
- Copy: sample labels are clearly marked Demo data. Production counts come from storage. Settings identify inactive/unimplemented integrations; booking value is distinct from recorded payments.

## Interactions and accessibility

Exercised browser journeys: mobile navigation/More menu, client creation, service creation and editing, booking overlap error, successful available booking, calendar date navigation, blocked time, waitlist opt-in, appointment completion, payment recording and report totals. Escape dismissed dialogs. Forms have labels, errors have alert roles, actions have accessible names, native dialogs manage focus, keyboard focus styling is present, and reduced-motion preferences are respected.

Runtime issue found and corrected: HTTP demo preview did not provide crypto.randomUUID; the non-persistent demo now uses a non-security identifier. Production IDs remain server-generated cryptographic UUIDs.

Console review: browser extension metadata errors were present under a chrome-extension URL; no application-origin error was observed during the final tested journeys. Temporary Vite dependency-cache errors during check/build were cleared before final captures; they were development-infrastructure issues, not accepted application errors.

## Verification limits / P3 follow-up

- Actual staff-authenticated production CRUD and export require a live staff session. Browser interactions used demo transport; real SQLite tests independently verify persistence, conflict guards, stale versions, unique conversion, consent retention, archive/restore and reporting.
- Full screen-reader testing and cross-browser testing remain follow-up work.
- Minor concept differences: slightly larger metadata, system-generated Canadian dates, no decorative plus on the Add booking button, and standard icon family rather than raster concept glyphs.
- The selected concept provides no empty/error/dialog designs; these were implemented as accessible, consistent extensions, not claimed to be pixel-matched source screens.

Calendar addition: appointment detail now offers a Google event draft. URL/date/privacy behaviour is covered by two Node tests; saving a real event and automatic sync are not claimed as verified.

Subscription addition: Settings now offers a private hosted feed rather than OAuth setup. A native dialog explains provider refresh delays, private-link handling, replacement/revocation and Google From URL setup. Demo mode never creates a public feed. Serializer and SQLite token lifecycle tests pass. Actual Google subscription remains a staff setup step.
