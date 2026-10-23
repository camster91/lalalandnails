# La La Land CRM build plan

1. Replace legacy identity-header trust with verified Cloudflare Access JWTs. Keep all CRM access disabled until team, audience and approved emails are configured.
2. Extend existing D1 enquiries with nullable follow-up date/archive timestamp, preserving records and public form compatibility.
3. Add bounded search/status/due/archive filters and optimistic updates to the staff API and inbox. Archive/restore replaces hard deletion.
4. Verify signed-token rejection/acceptance, migration preservation, persisted search/pagination/update/archive behaviour, Astro types and production build; deploy locked and check public-site availability and unauthenticated CRM responses.
5. Configure Access in the account, verify Cameron/Bianca sign-in, finish responsive/keyboard QA and complete an approved real enquiry-to-email test. Cloudflare setup and the additive production migration are complete; protected routes redirect to Access and public homepage/form validation remain available. Authenticated browser testing remains pending.
6. Later scope: deduplicated client directory, appointment calendar, activity history and reminders. No automatic client messages or billing are included in this release.
