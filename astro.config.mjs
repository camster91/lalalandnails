import cloudflare from '@astrojs/cloudflare';
import { sites } from '@openai/sites-vite-plugin';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lala-land-nails.cameron91.chatgpt.site',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  build: { format: 'directory' },
  vite: { plugins: [sites()] },
});
