# Approved pricing and booking release — 24 October 2026

Cameron approved the proposed catalogue and continuation of the release in the project conversation. This release enables the public pricing page, homepage menu preview, production booking selections, canonical indexing and sitemap entry. Existing introductory prices remain estimates before tax; Bianca agrees the final service and price.

Includes the latest PR #7 interactive structured manicure estimator and PR #8 three-step booking, private inspiration storage, staff review and explicitly agreed appointment prices. No payment is collected. One two-hour request per weekday remains the capacity policy.

Validation: 65 Node tests pass, Astro reports zero errors/warnings/hints, production build passes, production dependency audit reports zero vulnerabilities. Earlier responsive and booking browser checks are recorded in the existing QA notes. Local Astro production preview could not start in this environment; this is not a passed production runtime check. Verify the deployed menu, estimate, booking steps, availability and private Access boundary after release.

Database additions are two new tables and one index, created idempotently by the existing initializers. No existing records are deleted or rewritten. Keep private image routes behind Access. Do not export binary inspiration in ordinary JSON exports.

Rollback: redeploy the previous successful main commit af8a15924fee7f3bf836254500041291a40306e9 if public booking, Access protection or rendering fails. Preserve the additive tables and any requests received. The catalogue flag can disable the new selection route while preserving data.

Live notification receipt and authenticated staff image review remain separate operational verification; mocked send tests do not prove inbox delivery. Analytics hooks exist, but no analytics account has been activated.

Security scan review: GitGuardian incident 37744473 reports a Generic Password in historical commit 4218fb6, booking-options.ts line 55. Inspection confirms this is the URL.password rejection expression followed by a hostname regex, not a stored credential. Split the expression for clarity without changing validation or disabling scanners. Squash the booking PR into the pricing branch so intermediate development commits are not part of the production history.
