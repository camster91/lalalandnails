# Complete existing-site integration and QA — 24 October 2026

## Scope and source identity

Repository: https://github.com/camster91/lalalandnails. Baseline main: `83949379c84ec2cba6da4365087a507c5602ab79`. PR https://github.com/camster91/lalalandnails/pull/10 was already merged before this work began. The original PR description records its earlier Cloudflare production release; this pass independently inspected the public pages but did not independently inspect Cloudflare deployment logs.

New refinements are on local branch `qa/complete-site-integration`. No push, new hosted preview, merge, deployment, infrastructure update, production booking write or client notification was performed. PR #10's description was updated with this follow-up while preserving its original release record. The local refinements require a new PR; they cannot be added to an already-merged diff.

Existing typography, colours, imagery, layout, service menu, booking implementation and studio system are preserved. `src/data/pricing.ts` remains the approved pricing authority and is unchanged.

## Changes

- Derive the pricing calculator's initial medium-length and Tier 2 charges from the catalogue.
- Replace ambiguous Tier 4 `+$50+` labels with starting-price wording throughout the menu, calculator and booking choices.
- Make the new structured manicure card's starting price explicit.
- Align hero image disclosure with the existing “AI-generated inspiration · Not client work” wording.
- Replace the unverified two-to-four-week maintenance claim with individual schedule guidance from Bianca.
- Restore focus to the mobile menu control when a navigation choice closes the overlay; name the calendar group used for validation focus.
- Reconcile the historical pricing plan and launch checklist with the accepted pricing release. Request blocks remain the existing weekday policy, not a new walk-in-hours policy.
- Add repeatable complete-site browser and automated accessibility checks; enable the existing QA workflow for main and pull requests to main. CI workflow changes have been parsed locally, not run on GitHub for this unpublished branch.
- Keep Astro test servers in the foreground so the QA scripts can manage their lifecycle in agent environments. Allow an installed Chrome executable for constrained local environments.

## Verification

| Check | Result |
| --- | --- |
| `node --test tests/*.test.mjs` | 66 passed; isolated database tests and mocked notifications |
| `npm run check` | Zero errors, warnings or hints |
| `npm run build` | Passed, Astro/Cloudflare production output |
| `node scripts/qa-pricing-production.mjs` | Passed after build, using local production runtime |
| Existing pricing browser suite | All five widths passed; navigation, illustrations, estimator, canonical/noindex and homepage-to-menu-to-booking journey |
| Complete-site browser suite, local | Home, pricing, privacy and 404 pass at all five widths |
| Complete-site browser suite, live | Same public pages and widths pass; APIs intercepted |
| Automated accessibility | Zero axe WCAG 2 A/AA and 2.1 AA violations in reviewed public pages and final booking dialog |
| Keyboard checks | Skip link, mobile menu/Escape/focus, booking dialog/Escape, field validation and focus pass |
| Pricing parity | All 12 short/medium/long × art-tier combinations match booking quotes at each width; fills already include their catalogue length |
| Booking journey | Time → service/estimate → details, back navigation, help choosing and invalid empty details verified without submission |
| Images | All public-page images explicitly decoded before final screenshots, including lazy images |
| Live discovery/privacy | Canonical and robots metadata, one H1, sitemap, API crawl exclusions and hidden development studio routes pass; no street address/postal code published |
| Diff/workflow syntax | `git diff --check` and YAML parsing pass |
| `npm audit --omit=dev` | Zero reported vulnerabilities; limited to npm's production dependency classification |
| Full `npm audit` | 19 advisories: 1 critical, 13 high, 5 moderate; not a security clearance |

Widths: **320, 390, 768, 1024, 1440px**. Chromium automation used installed Google Chrome on macOS, Node v26.5.0, Astro 7.2.4 and Cloudflare adapter 14.2.3. The CI workflow continues to use Node 22.

Screenshots and machine-readable results are under ignored `qa-artifacts/local/` and `qa-artifacts/live/`. Independent visual review found no concrete clipping or overlap in phone home/pricing, desktop pricing or narrow booking screenshots. An initial missing-lazy-images capture limitation was corrected before the final pass.

The browser suite intercepts every `/api/` request. Availability is fabricated, and unexpected APIs are blocked. Server regression tests cover persisted bookings, day holds, pricing snapshots, authentication, image validation/privacy, stale updates and notification failure with isolated data. Browser testing does not establish real availability, successful live submission or notification delivery.

## Review dispositions and remaining limits

**Security:** the full audit includes Astro and build/runtime tools declared as development dependencies. A clear production-only audit does not establish that bundled SSR code is unaffected. The critical [Astro AVIF advisory](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) depends on processing untrusted AVIF through Sharp. This site uses the Cloudflare adapter and accepts only validated JPEG/PNG inspiration server-side; no exploit was demonstrated. Other advisories still require reachability review and a separately scoped dependency update. Do not use `npm audit fix --force` as an unreviewed downgrade/upgrade. Owner: repository maintainer/security reviewer.

**Delivery:** email failure intentionally preserves the saved request and its staff-queue entry rather than inviting duplicate submission. Regression tests verify that behavior. Actual email receipt and staff follow-through remain operational checks; this pass did not activate any notification or add a new contact policy. Owner: Bianca/Cameron.

**Accessibility:** the honeypot is excluded from tab navigation and the reviewed axe scans pass; a source-only concern about programmatic focus did not reproduce as a violation. A private calendar-feed dialog rerender may benefit from explicit focus management, but its authenticated rotate/disable journey was not exercised or changed in this content pass. Authenticated staff browser acceptance remains separate. Automated checks and screenshots do not establish complete assistive-technology conformance.

**Release/SEO:** the historical failed Cloudflare preview check on #10 is distinct from the recorded later production release. No new GitHub CI result exists for this local follow-up. Search Console, GBP access, rankings, analytics, conversion uplift and field Core Web Vitals were not measured. No credentials, testimonials, extra locations or private address were added. Real devices, Safari and Firefox remain untested.

## Readiness and next action

**Ready with conditions for review. Not cleared for unconditional production release.** Local content/presentation and required browser checks pass. Remaining conditions are dependency-security triage, publication of the follow-up through a new PR, its GitHub CI/review, and explicit merge/deployment approval. Existing public content passes the non-submitting smoke checks above. Client acceptance is not established.

Publish the local follow-up only with authorization; preserve #10's merged history. After an approved deployment, repeat live page, navigation, price, image, mobile and non-submitting booking checks against the released commit. Rollback should redeploy the previous known-good production artifact while preserving existing booking records; verify artifact identity and recovery access before release.

## Reproduce browser checks

Install `playwright` and `@axe-core/playwright` without changing the lockfile, then install Chromium (or set `QA_CHROME_PATH` to an installed Chrome executable). Start a local server with `ASTRO_DEV_BACKGROUND=1 npm run dev -- --host 127.0.0.1`, then run `node scripts/qa-site-browser.mjs`. Use `QA_ORIGIN=https://lalalandnails.ca` for the public non-submitting comparison. Run the production smoke suite separately after stopping the development server: concurrent workerd processes sharing local SQLite state can fail with `SQLITE_BUSY`. Disk limits initially interrupted optional browser installation; installed Chrome was used successfully without deleting user files.
