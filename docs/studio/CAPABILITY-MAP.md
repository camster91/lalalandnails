# La La Land salon workspace

Selected visual: first displayed mockup, Studio Today. Mobile-first, compact header, ivory surface, burgundy primary actions, restrained Fraunces headings and DM Sans interface. No invented operational metrics or seeded client records in production.

| Module | Responsibility | Depends on |
| --- | --- | --- |
| staff-access | Existing verified Cloudflare Access sessions | — |
| studio-shell | Responsive dashboard, navigation, states | staff-access |
| clients | Contact identity, preferences, consultations and consent | staff-access |
| services | Editable CAD prices, durations, length/design add-ons | staff-access |
| appointments | Enquiry conversion, bookings, calendar, availability and conflicts | clients, services |
| retention | Waitlist, rebooking, follow-up and review tasks | appointments |
| notifications | Transactional templates, delivery records, consent controls | appointments |
| payments | Stripe deposits and verified payment reconciliation | appointments |
| client-media | Private consented nail history images | clients |
| reporting | Operational counts, source and completed booking value | appointments |
| recovery | Audit log, exports, backup/recovery procedures | staff-access |

Build order: shell → clients/services → appointments → retention/media → notification/payment adapters → reporting/recovery.

## Acceptance and boundaries

- Preserve public homepage and call/text enquiry form; protect all staff data with existing JWT validation, same-origin writes, no-store and noindex.
- 390px mobile, 768px tablet and 1440px desktop; readable 16px forms, visible keyboard focus, labelled controls, accessible dialogs and no horizontal overflow.
- Genuine D1 persistence, bound parameters, explicit input limits, optimistic record versions, archive instead of hard delete.
- Toronto calendar dates and DST-safe booking conversion. Database-level overlap prevention, including blocked time and buffers.
- Services start unpriced/inactive until owner configuration; sample data only in a development preview.
- No automatic messages, charges, refunds or marketing consent inferred from appointment enquiries. Payment/reminder integrations remain visibly unconfigured until the owner supplies credentials/settings.
- Export only after an explicit staff action. No client data in analytics, URLs, logs or public storage.

## Verification

Node tests: `node --test tests/*.test.mjs`. Types: `npm run check`. Production: `npm run build`. Browser: primary creation/edit/calendar journeys plus mobile/tablet/desktop and keyboard checks. Live checks must distinguish authenticated CRUD, public form delivery, and enabled external integrations.

Rollback: revert application commit; keep additive studio tables and their data. Never restore legacy header-based authentication.
