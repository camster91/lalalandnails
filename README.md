# Lala Land Nails

Astro website for a Scarborough nail studio serving clients across the GTA and Durham Region.

Current preview: https://lala-land-nails.cameron91.chatgpt.site

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
- Local service content, comparisons, visit guidance and eight FAQs.
- Booking request API and authenticated admin interface backed by Cloudflare D1.
- Optional concierge and analytics configured through environment variables and verified settings.
- Metadata, structured data, robots and sitemap routes controlled by launch-readiness settings.

## Configuration and publishing

Edit verified business facts in `src/data/site.ts`. Copy `.env.example` to a local environment file when configuring optional integrations. Keep keys and local database files out of git. Cloudflare D1 must be bound as `DB`; the local Wrangler configuration contains a placeholder database ID. Apply the SQL migration in `drizzle/` to the intended environment as part of deployment setup.

The current website is hosted through Sites. This repository is a source snapshot and has no automatic deployment workflow. Hosting credentials, production database records and environment secrets are not included.

## Photography and assets

Current homepage photography uses real Pexels images as inspiration, not the studio's client portfolio. See `public/images/photography/CREDITS.md` for source attribution. Font licence files are included in `public/fonts/`.

Earlier generated campaign assets remain in `asset-pack/`, `source-assets/` and the older image directories for project history; they are not the current homepage photography.

## Review and launch status

Read `docs/Lala-Land-Growth-Review.html`, `AUDIENCE_COPY_AUDIT.md` and `LAUNCH_PACKET.md` before launch. The growth review is an evidence-based readiness assessment, not a ranking or lead-generation guarantee.

The preview currently uses a noindex gate. Confirm pricing, appointment duration, inclusions, contact details, visit logistics, approved domain, authentic portfolio and client proof. Verify booking delivery, notifications and analytics before turning on indexing or paid acquisition.

Snapshot source: Sites commit `b1019658c011c3bc81944760b833c02468be97c0` (23 October 2026).
