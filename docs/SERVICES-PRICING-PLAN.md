# La La Land Nail Hub — Services & Pricing implementation plan

**Historical plan:** Written before pricing approval. Its draft status and unchecked gates below record that earlier stage, not current publication authority. The approved catalogue is `src/data/pricing.ts`; see [the approved release record](studio/PRICING-BOOKING-RELEASE.md). PRs #7 and #10 are now merged. Do not copy the historical rates below into application code.
**Tracking:** [Issue #6](https://github.com/camster91/lalalandnails/issues/6)  
**Business owner approval:** Bianca  
**Implementation:** Cameron/dev

## Goal

Create a premium-but-simple experience for clients booking European/Russian-style dry manicures and natural-nail structured gel. Clients should see the difference between a new structured set, gel colour, structured fills, gel maintenance, length add-ons, art levels and individual repairs **before** sending an appointment request.

## Information architecture

| Placement | Recommendation | Purpose |
|---|---|---|
| Desktop + mobile menu | **Services & Pricing** at `/services-pricing` | One-tap access |
| Homepage | 3-card pricing preview directly after `#service` | Clarify starting costs before scrolling to booking |
| Full page | Separate sections: manicure → fills → lengths/shapes → art tiers → repairs → example → booking | All details, grouped by how clients decide |
| Booking form | Plain text link to pricing above date selection | Reduce unqualified enquiries |
| Footer | Services & Pricing | Persistent access |

Do **not** create separate thin pages for every nail type, extension or nearby suburb. Scarborough is the actual studio; Durham is a travel catchment, not another location.

## Proposed rates, not approved

- Manicures: European dry $45, European gel colour $60, structured gel (short) $75.
- Routine structured gel fills: short $70; medium $80; long $90. Gel colour refresh $60.
- Length adjustment on new structured gel: short included, medium +$10, long +$20, extra-long consultation.
- Art: Tier 1 minimal +$10; Tier 2 simple +$20; Tier 3 detailed +$35; Tier 4 bespoke +$50 and up.
- Single nail: minor chip/gel repair $5, structured gel repair $10, free-edge reconstruction $15, colour-only fix $5.
- Standalone gel removal $25. Standard suitable nail shapes included: round, square, squoval, oval, almond, tapered square.
- Example: $75 structured gel + $10 medium + $20 Tier 2 = **$105 CAD**, before applicable tax and any additional mutually agreed service.

**Rules:** No double charge for French/chrome already within a design tier. Fills include routine prep/removal of compatible product in the studio's own existing set, not an extra removal line. Other tech's product requires assessment. Complex art may not fit the current two-hour *request* block and needs schedule confirmation. No extensions menu is implied; single-nail reconstruction is a conditional repair only.

## Page copy and claims

Describe meticulous dry prep, careful shaping and natural-nail builder reinforcement without promising medical benefits, guaranteed longevity or allergy safety. HEMA-free product claims require verifying the exact products used; HEMA-free **does not** mean allergy-free. Do not claim all shades/products are HEMA-free solely from brand names. Respect living cuticle tissue.

Repairs are cosmetic only and may not be appropriate for bleeding, painful, infected or significantly separated nails. Have clients send clear inspiration/repair photos by an approved channel; do not ask for medical details in the booking form.

All visual references currently in `public/images/generated/` are **AI inspiration**, not actual client portfolio. The draft page reuses two labelled images. More specific length/art/repair examples require owner-provided/licensed photographs or explicitly labelled AI references approved for those categories.

## Repo implementation

- `src/data/pricing.ts` — proposed typed catalogue and display helper. All new page prices come from one data source, not arbitrary copy.
- `src/pages/services-pricing.astro` — complete draft page with responsive cards, fills list, length/art tiers, repair cards and clear CTA; separate canonical, noindex until explicit approval through `src/lib/seo.ts`.
- `src/components/PricingTeaser.astro` — starting price preview.
- `src/pages/index.astro` — preview after signature service.
- `src/components/Header.astro`/`Footer.astro` — navigation and working cross-page anchor URLs.
- `src/components/BookingRequest.astro` — pricing context link, preserving the existing two-hour, one-per-day *request* flow.

Not part of the draft: editing production D1 records, adding payments/deposits, changing booking availability, sending client emails, deploying to production or modifying DNS.

## Release gates

### 1. Awaiting Bianca
- [ ] Approve service titles, service scope, prices, “from” vs flat-rate use, inclusions and any surcharges.
- [ ] Confirm durations for each service, fill criteria (including 2–4-week guidance) and when to quote a full reset instead.
- [ ] Confirm gel removal, repair, reconstruction, post-service issue policy, booking/cancellation policy and which HEMA-free systems/shades are used.
- [ ] Approve suitable visual examples and any portfolio images or credentials. No fabricated client work or testimonials.
- [ ] Confirm whether an existing booking request supports the chosen service length/design time or requires special scheduling.

### 2. Engineering/QA
- [ ] Run Node tests, `npm run check`, `npm run build` on this branch and fix any failures.
- [ ] Test 320, 390, 768, 1024 and 1440px layouts, price wrapping, card order, focus, nav, typography and touch targets.
- [ ] Test all links from full page → homepage anchors and direct `/#booking` use; make sure no booking form duplication or blank state.
- [ ] Verify labels, image alt/disclosure, reduced motion, contrast and no layout shift.
- [ ] Confirm new route noindexes under draft rules and is **not** included in production sitemap until approved.
- [ ] After pricing approval, update `siteConfig.services`, valid price fields, FAQ/schema, `src/lib/seo.ts` and `sitemap.xml.ts` together; visible and structured content must match.
- [ ] Verify SEO canonical, sitemap, robots, no accidental PII or unsupported structured-data Offers/ratings.
- [ ] Get explicit sign-off before **merging**; main branch triggers Cloudflare deployment. Roll back by reverting the pricing-page PR if launch verification finds a regression.

## Status at time of draft

- **Completed and verified:** Repository inspection; existing site/booking/indexing mechanics reviewed; issue #6 created; draft files written to a separate branch (not main).
- **Completed awaiting verification:** Visual page implementation (needs build/browser QA).
- **In progress:** Reviewable PR and technical checks.
- **Blocked:** Published price approval and real tier-specific reference images.
- **Awaiting client/teammate:** Bianca's sign-off on final service list/policies and image examples.
- **Next action:** Run CI/build, then review draft PR and sign off before permitting public publication.
