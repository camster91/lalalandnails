# Site-wide search and appointment copy — 24 October 2026

## Goal and scope
Help visitors looking for dry manicures, gel colour and structured gel in Scarborough compare services, understand their estimate and submit a qualified appointment request. Durham/GTA visitors travel to the Scarborough studio; there are no additional locations. Extend existing content PR #10 rather than creating another site or competing location pages.

Homepage: local service overview and natural-nail fit. Menu: commercial comparison, prices, inclusions, lengths, art and maintenance. Booking: time → service → details, with optional inspiration and help choosing. Privacy and 404: clear task guidance. Private CRM/authentication screens stay outside search and retain functional labels.

## Evidence and decisions
Approved first-party catalogue in src/data/pricing.ts supplies all monetary values. Existing appointment policy supplies weekday two-hour blocks and one appointment per day. Shared FAQ data renders both visible homepage answers and FAQ structured data. Shared homepage metadata keeps the title and WebPage entity consistent. AI image disclosures, consent and final-confirmation boundaries remain explicit.

Reviewed public Scarborough service listings as qualitative market context, not keyword-volume, ranking or price research: https://www.tequilabeauty.com/russian-manicure and https://www.nailsforyoubridlewood.com/services . No competitor wording, credentials or results are reused.

Google primary guidance: https://developers.google.com/search/docs/appearance/ai-features and https://developers.google.com/search/docs/fundamentals/creating-helpful-content . Use readable visible answers, accurate entities, contextual links and indexable public content. No special AI files, hidden copy or additional city pages. No promise of rankings, AI citations, rich results or conversion uplift.

## Copy decisions
- Lead with actual services, location and a clear next step. Secondary hero action opens the price menu.
- Answer the price question using catalogue-derived CAD values; qualify add-ons and applicable taxes.
- Explain dry preparation versus gel colour versus a builder-gel overlay, without promising extensions, wear time or health benefits.
- Distinguish a two-hour request hold from a confirmed appointment. No online payment is taken; this does not establish a new deposit/cancellation policy.
- Address existing product, maintenance, design inspiration, travel and uncertainty before submission.
- Keep one consistent primary CTA, Request an appointment, and preserve the low-pressure help-me-choose path.
- Remove the absolute No surprise add-ons headline; explain how the estimate adds up instead.

## Measurement and limitations
No Search Console, search-query volumes or active conversion-analytics account was inspected. Search and conversion benefits are hypotheses. Existing booking-step and request events can measure service/detail progression and successful requests when an approved analytics property is connected. Report Toronto dates, exclude the archived release-QA request, and distinguish submitted requests from staff-confirmed appointments. Obtain a baseline before claiming improvement.

## QA and release
Run existing Node tests, Astro check and production build; inspect homepage, pricing, privacy and 404 in browser with phone/desktop layouts. Verify price accuracy, FAQ/schema parity, navigation, CTA flow, no new overflow and private-route noindex. These content changes do not alter booking logic, prices, database records, image files or authentication. Record exact verification and release status on PR #10.

Verified final copy: 66 Node tests passed; Astro check 98 files, zero errors/warnings/hints; production build passed. Browser homepage has one H1, matching WebPage title and all 10 FAQ answers identical to structured data. Desktop width 1348px, narrow-phone content width 305px and tablet pricing content width 753px had no horizontal overflow or clipped headings/paragraphs. Menu estimate remained $105; popup copy, privacy route, 404 recovery and internal links were checked without submitting a request. No analytics, AI assistant, profiles or messages were activated.
