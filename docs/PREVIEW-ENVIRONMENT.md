# Cloudflare preview environment

Worker Previews use the `previews` block in `wrangler.jsonc`. Production settings remain at the top level. Astro preserves these preview settings in `dist/server/wrangler.json`.

- `SESSION` uses `lalalandnails-preview-session`, separate from production session storage.
- `DB` uses the empty `lalalandnails-preview` database. Never copy client data into it. Existing schema initializers create tables when preview availability is first requested.
- Preview branches share these nonproduction resources with each other. They are isolated from production, not from other preview branches.
- `IMAGES` is available for the existing Cloudflare image service.
- `send_email` is empty. No booking email binding is available, so fabricated preview requests cannot send real notifications. The request handler still saves a request when notification delivery is unavailable.
- Staff authentication remains unchanged and fails closed without approved Access settings. No production secrets are copied into the preview configuration.
- Noncanonical preview hosts remain noindex. Production domains and schedules are not configured in the preview block.

After building, run `node scripts/qa-preview-config.mjs`. CI runs the same check. It validates source and generated bindings, rejects shared production IDs, and checks that notifications stay disabled.

Deploy a feature branch with the existing Cloudflare Workers Builds preview trigger (`npx wrangler preview`). Confirm the deployed preview points to the preview resource IDs before making any fabricated test request. Public UI tests can continue to intercept all booking APIs. A preview test request belongs only in the test database and is not a real appointment.

For a synthetic saved-request check, label the test clearly, use a reserved fictional contact, and record its request ID. After verification, remove only that exact synthetic request and its `booking_request_details` / `booking_inspiration` rows from the preview database, children first. Confirm the preview slot becomes available again. Never run this cleanup against production or real client records.

Build-managed previews have `auto_delete` enabled: deleting a retired feature branch removes its Preview. Keep the branch while its review URL is needed. The shared nonproduction KV namespace and database remain available for other preview branches; remove them only after all previews and configuration references have been retired.

Rollback the preview configuration by restoring the saved pre-change configuration or reverting this change. Do not replace preview IDs with production IDs to make a preview deploy pass. Existing production deployment and booking data do not need to change.
