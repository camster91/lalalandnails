# La La Land Nails — existing-site content map

**Scope: Content integration only.** Keep the existing Astro website, components, booking implementation, colours, typography and images. Do not create a replacement site or another booking system.

| Existing area | Content and purpose |
|---|---|
| Homepage hero (`src/pages/index.astro`) | Explain European/Russian-style dry manicure and natural-nail structured gel specialty, plus Scarborough service location |
| Homepage signature service | Clarify European dry vs gel colour vs structured gel, and link to complete menu |
| Homepage pricing teaser | Show main starting prices and direct links for returning-client fills and individual repairs |
| Homepage inspiration guide | Help choose natural nail length/shape, art complexity and existing-product maintenance before booking |
| Existing `/services-pricing` | All starting prices, nail art tiers, fills, repairs/reconstruction, length guide, price estimator and FAQ |
| Booking request (`/#booking`) | Existing time → service/extras → details and optional inspiration flow; final price and appointment confirmed by Bianca |
| Homepage FAQ and policy summary | Answer service differences, fills, repairs, HEMA-free caveat, booking expectations and locality |
| Footer and SEO metadata | Accurate specialty and one Scarborough location; no unverified street address or credentials |

All listed CAD price values remain in the shared `src/data/pricing.ts` catalogue. Service copy and booking estimates must not establish new price literals. HEMA-free does not mean allergy-free; confirm exact product formulation. AI imagery stays clearly described as inspiration rather than client results.

**QA:** Run Node tests, Astro check, build and responsive browser QA for home, pricing anchors, and existing three-step booking. Check metadata/FAQ schema parity, keyboard focus, reduced-motion, no horizontal overflow, and privacy of inspiration attachments.

**Release:** This content-only change is a separate PR based on the latest main after the combined pricing/booking PR was merged. Do not merge or deploy without explicit approval. Cloudflare preview configuration is separately tracked in GitHub issue #9.
