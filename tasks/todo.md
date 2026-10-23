# CRM status

- [x] Replace unverified identity-header authentication with Cloudflare Access JWT validation.
- [x] Add enquiry search, status filters, bounded pagination and due-follow-up view.
- [x] Add private notes, follow-up dates and stale-write rejection.
- [x] Replace permanent deletion with reversible archive/restore.
- [x] Test preservation of legacy enquiries and repeated migration on SQLite through a D1-compatible adapter.
- [x] Pass signed-token, validation and database behaviour tests.
- [ ] Configure Cloudflare Access application paths, team domain, audience and approved staff emails.
- [ ] Verify successful live staff login and authorized CRM reads/writes.
- [ ] Verify mobile/tablet/desktop and keyboard journeys in Chrome.
- [ ] Verify real appointment form notification delivery to Bianca after destination verification.
- [ ] Plan separate client-directory/calendar/reminder increments after the inbox is usable.
