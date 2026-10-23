# Salon workspace implementation status

The selected direction is the first displayed mobile mockup (Studio Today). This release implements the operational core, not every integration in the wider feature list.

## Completed and verified locally

- Compact responsive dashboard with live appointment/enquiry/follow-up totals; desktop sidebar and mobile bottom navigation.
- Existing Access JWT authorization retained. All new staff APIs check authorization before initializing or querying storage. Mutation APIs require the same Origin.
- Client directory: search, pagination, duplicate phone/email detection, preferences, private consultation notes and explicit marketing/photo consent. Consent dates survive unrelated edits.
- Editable CAD service variants with price, duration and buffer. No invented production prices or services. Inactive services cannot be booked.
- Manual appointments, date/week calendar, blocked time, rescheduling and confirmed/completed/cancelled/no-show statuses.
- Database triggers prevent overlaps and buffer conflicts even when writes race. Toronto DST gaps and ambiguous times are rejected.
- Phone/Instagram/referral enquiries, call/text links, notes, follow-up dates, archive/restore and unique enquiry-to-booking conversion.
- Opt-in waitlist; manual rebooking; nail/service history notes. No outbound messages triggered.
- Google Calendar event draft action (Toronto times, no client PII in the URL). This is a user-saved copy, not OAuth or two-way sync.
- Manual payment records; monthly completed booking value and separately recorded payments. Historic appointment prices remain stable after service edits.
- Private JSON export, staff activity log and recovery of archived records. Export is not a database backup or a verified restore.
- Development-only sample preview and side-by-side reference comparison. Production preview pages return 404 and production JavaScript contains no sample-client fixtures.
- 27 Node tests, Astro type check (zero errors/warnings/hints), production build, and production dependency audit (zero known vulnerabilities).

## Completed but awaiting live verification

- New production D1 tables/migrations and actual staff create/edit/archive/export journeys.
- Mobile/browser interactions were exercised against demo transport; persistence/invariants were tested against real SQLite through a D1 adapter. These are separate verification layers and do not prove live authenticated end-to-end writes.

## Blocked activation / remaining implementation

| Capability | Dependency and remaining work |
| --- | --- |
| Calendar subscription | Implemented: Settings → Manage calendar feed → Create private link. Add the URL in Google Calendar on desktop under Other calendars → From URL. Calendar apps refresh on their own schedules. Rotation revokes the old link; disabling stops future reads. |
| Public online booking | Confirm salon hours, advance notice, cancellation rules and final prices/durations. Implement public availability, reservation lifecycle and anti-abuse protection before enabling. Existing call/text enquiry form is preserved. |
| Stripe deposits/refunds | Salon Stripe connection, approved deposit/refund rules, webhook verification and reconciliation. Manual payment records do not call Stripe. |
| Transactional reminders | Verified sending service that can deliver to clients, approved templates and delivery/retry records. Existing enquiry forwarding to Bianca is a separate flow requiring delivery verification. |
| SMS | Owner-selected provider, billing approval and consent rules. Call/text links open the staff device; they do not send automatically. |
| Client photo uploads | Private R2 binding, file validation/access controls, upload/gallery implementation, retention/deletion policy and explicit client consent. No public client-media storage. |
| Marketing/reviews | Confirm review destination and opt-in lifecycle rules; add source attribution, review-request workflow and consented retention campaigns. No fabricated conversion or revenue claims. |
| Backup recovery | Confirm D1 recovery settings and complete a restoration rehearsal. JSON export is supplementary. |

## Deployment and rollback

Public homepage, lead capture and SEO are outside the UI change. New tables are additive and created only following authenticated staff access. Revert the focused application change to roll back; preserve the new tables and Access guard. Never restore the earlier identity-header authentication.

Private calendar feed: includes appointments and blocked time, with stable IDs, UTC instants, revision metadata and cancelled events. Client names, contact details, notes and block labels are excluded. Only a SHA-256 token digest is stored. This is one-way subscription, not two-way calendar editing. Old downloaded copies cannot be remotely erased.
