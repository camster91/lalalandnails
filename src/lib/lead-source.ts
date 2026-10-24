const known = new Set(['google','bing','instagram','facebook','pinterest','referral','direct']);
export function leadSource(source: unknown): string {
  return typeof source === 'string' && known.has(source.toLowerCase()) ? source.toLowerCase() : 'unknown';
}
/** Store a channel label only: no referring URLs, search terms or campaign identifiers. */
export function detectLeadSource(page: string, referrer: string): string {
  const url=new URL(page);
  const tagged=leadSource(url.searchParams.get('utm_source'));
  if(tagged !== 'unknown') return tagged;
  if(!referrer) return 'direct';
  try {
    const host=new URL(referrer).hostname.toLowerCase();
    if(host === url.hostname) return 'direct';
    if(['google.com','google.ca','google.co.uk'].some(domain=>host === domain || host.endsWith('.'+domain))) return 'google';
    if(/(^|\.)bing\.com$/.test(host)) return 'bing';
    if(/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    if(/(^|\.)facebook\.com$/.test(host)) return 'facebook';
    if(['pinterest.com','pinterest.ca','pinterest.co.uk'].some(domain=>host === domain || host.endsWith('.'+domain))) return 'pinterest';
    return 'referral';
  } catch { return 'unknown'; }
}
