# Operational core review

Reviewed correctness, security, architecture, readability and performance before release.

- Bound SQL values and fixed table-name allowlists; escaped HTML output including client notes, labels and contact links.
- Existing signed Access identity required on each private API before any storage access. Same-origin protection on all writes and exports; private/no-store/noindex headers.
- JSON mutations have a 16 KiB input bound; strings, IDs, dates, currencies, durations, statuses and versions are validated server-side.
- Conflict detection runs in database triggers, not only in a preflight query. Transactions keep mutation/audit/conversion together. Optimistic versions reject stale writes.
- Client phone/email uniqueness does not silently merge people. Consent is opt-in and its original timestamp is preserved across unrelated edits.
- Searches and lists are bounded; monthly aggregate reports do not depend on the visible page. Historic service prices are snapshotted on appointments.
- Production previews return 404. Built JavaScript was checked for demo-client strings; none were found. No live customer rows were copied into fixtures.
- New Phosphor dependency is MIT licensed, locked to the resolved package, and adds no transitive packages. Production npm audit reported zero known vulnerabilities.
- UI formatting helpers are separate from the interaction controller. No public-site marketing layout or form changes are included.

Locally verified: 27 tests, Astro check with zero diagnostics, production build, and browser journeys listed in design-qa.md. Live authenticated CRUD/export remains a release verification gap, not a passed check.

Approved scope: operational core with inactive integration setup states. Wider integrations remain explicitly tracked in IMPLEMENTATION-STATUS.md; this is not an all-features completion claim.

Google Calendar uses the official eventedit template documented at https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events . UTC start/end instants and Toronto display timezone are tested. No client identity, contact information or private notes are included. Cancelled/invalid appointments do not generate a handoff link.

Subscription review: public read-only route requires a random 256-bit bearer token; only its hash is persisted. Staff management requires verified Access identity and same-origin writes. Rotation and disable actions are atomic and audited. Feed fields are selected explicitly, with no client joins or private text. Cancelled bookings and archived blocks remain cancellation events. Token URLs are returned only on creation, with no-store/no-referrer headers. Thirty Node tests pass, including token lifecycle and calendar privacy.
