# Lala Land Nails

Astro website for a Scarborough nail studio serving clients across the GTA and Durham Region.

Live site: https://lalalandnails.ca/

Staff workspace: https://lalalandnails.ca/admin

## Development

Requires a Node.js version supported by the installed Astro release.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run build
```

## Application

- Responsive homepage with full-width sections and content contained to 1440px.
- Sliding inspiration gallery, section motion and reduced-motion support.
- Local service content, visit guidance and FAQs driven by verified site configuration.
- Booking request API and authenticated admin interface backed by Cloudflare D1.
- Optional concierge and analytics configured through environment variables and verified settings.
- Metadata, structured data, robots and sitemap routes with explicit public-route indexing. The canonical homepage is indexable; staff, API, preview and privacy routes remain noindex.
- Appointment CTAs open a native request dialog, with a single shared form and inline fallback.
- Private calendar subscription feed with token rotation/revocation; no Google OAuth required.
- Privacy notice and general lead-source labels in CRM reports.

## Configuration and publishing

Edit verified business facts in `src/data/site.ts`. Copy `.env.example` to a local environment file when configuring optional integrations. Keep keys and local database files out of git. Cloudflare D1 must be bound as `DB`; the Wrangler configuration identifies the intended binding. Verify the target account/database before applying any migration.

The live site is hosted on Cloudflare Workers. Cloudflare Workers Builds deploys the GitHub main branch using npm run build and npx wrangler deploy. Production secrets and database records are not stored in git. The initializer in src/lib/db-schema.ts applies additive enquiry schema changes; studio tables initialize separately.

## Photography and assets

Current homepage imagery is AI-generated inspiration, clearly labelled; it is not client work, a studio photograph or a verified result. Earlier Pexels assets retain their attribution in public/images/photography/CREDITS.md. Font licence files are included in public/fonts/.

Earlier assets remain in asset-pack/, source-assets/ and older image directories for project history.

## Review and launch status

Read `docs/Lala-Land-Growth-Review.html`, `AUDIENCE_COPY_AUDIT.md` and `LAUNCH_PACKET.md` before launch. The growth review is an evidence-based readiness assessment, not a ranking or lead-generation guarantee.

The canonical homepage is public and indexable. Remaining business inputs and verification limits are tracked in docs/studio/SITE-REVIEW-FIXES.md. The older growth review and original Sites snapshot describe historical states; current code and release notes take precedence.

Snapshot source: Sites commit `b1019658c011c3bc81944760b833c02468be97c0` (23 October 2026).
