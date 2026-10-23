import type { SiteConfig } from '../data/site';

export function isPublicOrigin(site: SiteConfig, url: URL): boolean {
  return Boolean(site.indexingEnabled && site.approvedDomain && url.origin === new URL(site.approvedDomain).origin);
}

export function isIndexable(site: SiteConfig, url: URL): boolean {
  return isPublicOrigin(site, url) && url.pathname === '/';
}

export function buildRobots(site: SiteConfig, url: URL): string {
  if (!isPublicOrigin(site, url)) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /signin-with-chatgpt\nSitemap: ${site.approvedDomain}/sitemap.xml\n`;
}

export function buildSchema(site: SiteConfig) {
  const origin = site.approvedDomain ?? site.canonicalOrigin;
  const id = (name: string) => `${origin}/#${name}`;
  const service = site.services[0];
  const business = {
    '@type': 'BeautySalon', '@id': id('business'),
    name: site.businessName, url: `${origin}/`,
    logo: `${origin}/brand/logo-main.svg`,
    description: 'European manicure appointments with Bianca Ashley in Scarborough, Toronto, Ontario. Welcoming clients from Durham Region and the GTA.',
    areaServed: ['Scarborough', 'Durham Region', 'Greater Toronto Area'],
    address: {
      '@type': 'PostalAddress', addressLocality: site.location.locality,
      addressRegion: site.location.region, addressCountry: site.location.country,
      ...(site.location.streetAddress ? { streetAddress: site.location.streetAddress } : {}),
      ...(site.location.postalCode ? { postalCode: site.location.postalCode } : {}),
    },
    ...(site.contact?.type === 'phone' ? { telephone: site.contact.href.replace('tel:', '') } : {}),
    ...(site.socials.length ? { sameAs: site.socials.map((social) => social.href) } : {}),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      business,
      { '@type': 'Person', '@id': id('bianca'), name: site.provider.name, jobTitle: site.provider.role, url: id('about'), worksFor: { '@id': id('business') } },
      { '@type': 'WebSite', '@id': id('website'), url: `${origin}/`, name: site.businessName, inLanguage: 'en-CA', publisher: { '@id': id('business') } },
      { '@type': 'WebPage', '@id': id('webpage'), url: `${origin}/`, name: 'European Manicures in Scarborough | La La Land Nail Hub', inLanguage: 'en-CA', isPartOf: { '@id': id('website') }, about: { '@id': id('service') }, publisher: { '@id': id('business') } },
      { '@type': 'Service', '@id': id('service'), name: service.name, serviceType: site.specialty, description: service.description, url: id('service'), provider: { '@id': id('business') }, areaServed: business.areaServed, availableChannel: { '@type': 'ServiceChannel', serviceUrl: id('booking') } },
      { '@type': 'FAQPage', '@id': id('faq'), url: id('faq'), isPartOf: { '@id': id('webpage') }, mainEntity: site.faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
    ],
  };
}

// Escape script delimiters without changing the parsed structured-data content.
export const serializeSchema = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');
