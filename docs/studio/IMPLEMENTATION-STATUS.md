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
- 41 Node tests, Astro type check (zero errors/warnings/hints), production build, and production dependency audit (zero known vulnerabilities).

## Completed but awaiting live verification

- New production D1 tables/migrations and actual staff create/edit/archive/export journeys.
- Mobile/browser interactions were exercised against demo transport; persistence/invariants were tested against real SQLite through a D1 adapter. These are separate verification layers and do not prove live authenticated end-to-end writes.

## Blocked activation / remaining implementation

| Capability | Dependency and remaining work |
| --- | --- |
| Calendar subscription | Implemented: Settings → Manage calendar feed → Create private link. Add the URL in Google Calendar on desktop under Other calendars → From URL. Calendar apps refresh on their own schedules. Rotation revokes the old link; disabling stops future reads. |
| Public appointment requests | Implemented: two-hour blocks, weekdays 10–15 Toronto time, next 90 days, one request/appointment per day. Start times 10:00/11:00/12:00/13:00. Submission holds the whole day until staff confirm or decline. Prices, service scope and visit details are agreed by call/text before confirmation. |
| Stripe deposits/refunds | Salon Stripe connection, approved deposit/refund rules, webhook verification and reconciliation. Manual payment records do not call Stripe. |
| Transactional reminders | Verified sending service that can deliver to clients, approved templates and delivery/retry records. Existing enquiry forwarding to Bianca is a separate flow requiring delivery verification. |
| SMS | Owner-selected provider, billing approval and consent rules. Call/text links open the staff device; they do not send automatically. |
| Client photo uploads | Private R2 binding, file validation/access controls, upload/gallery implementation, retention/deletion policy and explicit client consent. No public client-media storage. |
| Marketing/reviews | Confirm review destination and opt-in lifecycle rules; add source attribution, review-request workflow and consented retention campaigns. No fabricated conversion or revenue claims. |
| Backup recovery | Confirm D1 recovery settings and complete a restoration rehearsal. JSON export is supplementary. |

## Deployment and rollback

The public request calendar initializes the additive availability schema without exposing staff records. Staff mutations remain Access protected. Revert the focused application change to roll back; preserve the new tables and Access guard. Never restore the earlier identity-header authentication.

Private calendar feed: includes tentative requested blocks, appointments and blocked time, with stable IDs, UTC instants, revision metadata and cancelled events. Client names, contact details, notes and block labels are excluded. Only a SHA-256 token digest is stored. This is one-way subscription, not two-way calendar editing. Old downloaded copies cannot be remotely erased.

## Public calendar policy — 2026-10-24

The owner approved Monday–Friday, 10 a.m.–3 p.m., two-hour blocks and one appointment per day. Submitted requests atomically hold the whole Toronto calendar day. Decline releases an unconverted request; archive only organizes it. Conversion transfers the claim to a two-hour appointment in the same transaction; cancellation frees the day. Blocks remove overlapping public options. The private feed preserves the request UID on conversion and marks unconfirmed requests tentative.

Server validation covers weekends, past starts, the 90-day horizon and Toronto DST. D1 indexes/triggers arbitrate concurrent requests, staff appointments and blocks. Public availability returns dates/times only. Validated submissions are limited to three per daily network bucket using a daily SHA-256 identifier; the trusted Cloudflare address is never stored raw. Expired buckets are cleared on the next request. Honeypot and existing per-phone duplicate controls remain. No live test request or client notification was sent.

Verified with 41 Node tests, Astro check and production build. Browser QA covers calendar selection, popup draft preservation, month navigation and narrow responsive layouts. Live staff write/email delivery remain separate operational checks.
