# La La Land: search and booking growth

23 October 2026 · Scarborough, Toronto, Ontario · camster91/lalalandnails

## Goal and evidence

Generate qualified European manicure enquiries for Bianca's Scarborough appointments, including people travelling from Durham Region and the GTA. The conversion is a genuine call/text request; a confirmed appointment is a separate outcome.

Inspected: current repository, live homepage HTTP response, existing form implementation, canonical domain, robots/sitemap implementation, approved site facts, image disclosures and public search results. Research showed nearby businesses use European/Russian manicure and structured-gel terminology, but this is not measured keyword demand or evidence that every term is an approved La La Land service. No Search Console, analytics, Business Profile performance, backlink or lead-quality dataset was reviewed. No measured ranking, traffic, conversion baseline or audit score is claimed.

## Implemented

| Area | Change | Acceptance criteria |
|---|---|---|
| Indexing | Separate public indexing from broader marketing completeness | Canonical homepage permits indexing even while pricing/proof/analytics remain incomplete; Worker previews, admin and missing pages do not |
| Crawl controls | Canonical robots and sitemap; exclude private routes | Public robots allows homepage and identifies canonical sitemap; previews disallow crawling and have no sitemap URLs |
| Local relevance | Scarborough in H1; explicit Toronto/ON location and Durham catchment | Never imply a second studio in Pickering, Ajax or Whitby |
| Answer clarity | Expanded direct FAQ and booking answers | Answers are visible server-rendered text; schema uses the same source |
| Entity relationships | Linked BeautySalon, Person, Service, WebSite, WebPage and FAQPage | Canonical @ids resolve; no fabricated address, pricing, ratings, hours or credentials |
| Conversion messaging | Explain callback, existing product/removal discussion, price confirmation and what happens next | Form remains name/phone/call-or-text/optional notes/consent; submission does not promise a confirmed appointment |
| Measurement preparation | View/start/validation/failure/success events | No name, phone, notes, email, raw error message, URL query or booking ID is sent as an event property; analytics remains inactive until configured |
| Imagery | Retain reference-grounded AI set and disclosure | Never describe generated work as client proof |

The partial postal address is truthful locality data, not a complete public street address. LocalBusiness rich-result eligibility and Google Business Profile accuracy are not verified. FAQ markup expresses the visible Q&A; Google has retired FAQ rich results, so it is not an enhancement promise. No special AI file, invented authority, keyword stuffing or duplicate city pages were added.

## Homepage intent map

| Intent | Destination | Evidence or next improvement |
|---|---|---|
| European manicure Scarborough | / and #service | Confirmed service and studio locality |
| European manicure Toronto / east GTA | / and #visit | Scarborough location clearly stated |
| Travelling from Durham/Pickering/Ajax/Whitby | #visit and #faq | Visitor guidance; not a claim of local premises |
| Price and appointment length | #service and #faq | Discuss before confirming; actual rates/time await Bianca |
| How to book / call or text | #process and #booking | Current callback flow |
| Nail shape, colour and inspiration | #looks and visit guide | Labelled AI inspiration; actual possibilities discussed before confirmation |
| Russian / structured gel, maintenance, fills, repairs | Future service content after scope confirmation | Do not silently extend the approved European manicure offer or invent service details |

## Funnel and measurement

Existing `booking_request_view` means an appointment CTA was activated, not that the form was visible. New `booking_form_viewed` fires once when at least 25% of the form intersects the viewport. `booking_request_started` fires once on first input/change and resets after success. `booking_validation_error` records a failed client validation attempt. `booking_request_failed` records a failed submission. `booking_request_submitted` fires after an affirmative API result. Honeypot/spam filtering and stored-request reconciliation still need live QA. These are instrumented hooks, not verified analytics collection.

Once an approved Plausible domain is connected, validate one action at a time in the receiving account. Exclude test/spam requests when comparing events to D1 records. A successful API event is not proof of email delivery or a confirmed client booking. Bianca should record contacted/confirmed outcomes separately. Baseline: form-view-to-start, start-to-success, qualified-enquiry-to-confirmed-appointment. Segment traffic by channel and broad device class only after collection is verified. Avoid claiming lift from small samples.

## Priorities and owners

1. **Cameron/Bianca:** verify Bianca's Cloudflare destination email and complete an approved real form-to-inbox test. Verify the owner can securely access saved requests on the custom domain; the current admin sign-in relies on the original Sites authentication flow and requires deployment-specific review. Do this before promoting the site or spending on traffic.
2. **Bianca:** approve the price list, typical appointment duration, inclusions, removal/fill/repair scope, hours, cancellation/deposit terms, public contact method and actual business-name usage. Keep the home address private unless she explicitly approves publishing it.
3. **Cameron:** connect Search Console, submit /sitemap.xml and inspect the canonical homepage after release. Passing robots checks permits discovery; it does not establish that Google has indexed the page.
4. **Cameron:** connect an approved analytics property and observe funnel events. Current analytics domain is null; no new account, paid subscription or data collection was activated.
5. **Bianca:** provide permission-cleared client photos and genuine reviews. Replace AI inspiration with actual work where appropriate. Request honest feedback without invented reviews or incentives.
6. **Cameron/Bianca:** verify or establish an eligible Google Business Profile with accurate appointment location, category, contact and hours. Do not claim extra city locations or a mobile service. Profile actions require separate approval.

## Marketing rollout after lead handling is verified

- Positioning: European manicure appointments with Bianca in Scarborough; request a call or text and confirm the details before booking.
- Instagram/Pinterest: lead with permission-cleared real work when available, explain shape/finish options, and link to the homepage booking section. Label any AI imagery as inspiration. Draft caption: “Planning your next manicure? La La Land Nail Hub offers European manicure appointments with Bianca in Scarborough. Share your ideas and request a call or text at lalalandnails.ca. Service, price and visit details are agreed before your appointment is confirmed.”
- Local discovery: maintain one consistent business identity; use genuine local partnerships and accurate business listings after confirming public details. No mass directory submission or unsolicited messaging was performed.
- Content sequence: finish the service/pricing details first; then build one useful service page and a genuine about/visit page. Avoid near-identical city landing pages. Create maintenance/repair/preparation content only after Bianca confirms the relevant service scope and guidance.
- CRO hypotheses: compare appointment CTA wording, inspect where people abandon the short form, and test whether approved upfront price ranges improve qualified enquiries. First establish reliable traffic and lead outcomes, change one material element at a time, and measure booked appointments as well as submissions. No uplift is assumed.
- Paid campaigns: defer until lead delivery, approved offer/pricing, consent, tracking and landing-page QA are verified. No budget was spent or ads launched.

## QA, limits and rollback

Automated: canonical/preview/noindex rules, indexing off-switch, robots controls, FAQ parity, entity references and safe JSON-LD serialization are covered by Node tests. Run `node --test tests/*.test.mjs`, `npm run check`, and `npm run build`.

Pending browser QA: 320/390px phones, 768px tablet, 1024/1440px desktop. Confirm hero wrap, shared columns, image crop, no horizontal overflow, keyboard navigation/focus, menu, FAQ toggles, gallery arrows, reduced motion, form required-field/phone errors, one submission while pending, failure recovery and success messaging. Verify no PII in URLs or analytics requests. Chrome connection is currently unavailable; no visual or performance score is claimed. External schema validators and Search Console inspection remain pending.

Rollback: revert the focused marketing commit on GitHub to restore the preceding image-release version. For a temporary crawl pause, set `indexingEnabled: false` and deploy; this does not remove already-indexed URLs immediately. No database migration, DNS edit or paid account change is part of this release.

## Primary sources checked

- Google AI features: https://developers.google.com/search/docs/appearance/ai-features
- Google LocalBusiness markup: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Google documentation updates (FAQ rich-result retirement and llms.txt guidance): https://developers.google.com/search/updates
- Google Business Profile representation guidance: https://support.google.com/business/answer/3038177

Search and generative-answer visibility depend on discovery, indexing, useful evidence and external signals; implementation does not guarantee ranking, AI citations, rich results or a 100/100 marketing score.
