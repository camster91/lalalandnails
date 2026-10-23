import cloudflare from '@astrojs/cloudflare';
import { sites } from '@openai/sites-vite-plugin';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lalalandnails.ca',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  build: { format: 'directory' },
  vite: { plugins: [sites()], server: { allowedHosts: ['terminal.local'] } },
});
