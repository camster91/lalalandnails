# CRM status

- [x] Replace unverified identity-header authentication with Cloudflare Access JWT validation.
- [x] Add enquiry search, status filters, bounded pagination and due-follow-up view.
- [x] Add private notes, follow-up dates and stale-write rejection.
- [x] Replace permanent deletion with reversible archive/restore.
- [x] Test preservation of legacy enquiries and repeated migration on SQLite through a D1-compatible adapter.
- [x] Pass signed-token, validation and database behaviour tests.
- [x] Configure Cloudflare Access application paths, team domain, audience and approved staff emails.
- [x] Apply and verify the additive production D1 migration; confirm public homepage/form validation and Access redirects.
- [ ] Verify successful live staff login and authorized CRM reads/writes.
- [ ] Verify mobile/tablet/desktop and keyboard journeys in Chrome.
- [ ] Verify real appointment form notification delivery to Bianca after destination verification.
- [ ] Plan separate client-directory/calendar/reminder increments after the inbox is usable.

# Salon workspace expansion — selected UI direction 1

- [x] Implement the compact responsive studio shell and operational core described in docs/studio/IMPLEMENTATION-STATUS.md.
- [x] Verify persistence/invariants on SQLite, signed authentication tests, Astro types, build and production dependency audit.
- [ ] Verify the new production UI and actual authenticated create/edit/archive/export journeys after deployment.
- [ ] Confirm salon hours, booking policies, final prices/durations; implement public availability/reservations with anti-abuse protection.
- [ ] Connect salon Stripe, implement deposits/refunds and verified webhook reconciliation.
- [ ] Configure transactional sender; implement client confirmation/reminder/review templates, delivery records and retries.
- [ ] Select and approve SMS provider costs before enabling consented text reminders.
- [ ] Provision private media storage and implement validated consent-controlled uploads/gallery/retention.
- [ ] Add source attribution and consented retention workflows; confirm review destination.
- [ ] Verify database recovery settings and rehearse a restoration.

- [x] Add a prefilled Google Calendar event action with exact Toronto instants and no client PII in URLs.
- [x] Implement a private hosted iCalendar subscription feed with hashed tokens, rotation/revocation, stable event IDs and cancellation updates. Google OAuth is not needed.
