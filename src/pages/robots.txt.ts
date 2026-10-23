import type { APIRoute } from 'astro';
import { siteConfig } from '../data/site';
import { buildRobots } from '../lib/seo';

export const GET: APIRoute = ({ url }) => {
  const body = buildRobots(siteConfig, url);

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
