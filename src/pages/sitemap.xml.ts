import { guides } from '../data/service-guides';
import { pricingDraft } from '../data/pricing';
import type { APIRoute } from 'astro';
import { siteConfig } from '../data/site';
import { isPublicOrigin } from '../lib/seo';

export const GET: APIRoute = ({ url }) => {
  const origin = siteConfig.approvedDomain ?? siteConfig.canonicalOrigin;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${isPublicOrigin(siteConfig, url) ? `<url><loc>${origin}/</loc></url>${pricingDraft.approved ? ['/services-pricing', '/durham-region-manicures', ...guides.map(g => g.path)].map(path => `<url><loc>${origin}${path}</loc></url>`).join('') : ''}` : ''}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
};
