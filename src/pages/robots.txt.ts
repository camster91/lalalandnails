import type { APIRoute } from 'astro';
import { siteConfig } from '../data/site';

export const GET: APIRoute = () => {
  const origin = siteConfig.approvedDomain ?? siteConfig.canonicalOrigin;
  const body = siteConfig.launchReady
    ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
