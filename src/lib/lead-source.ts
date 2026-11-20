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

/** Carry the channel label across internal links in the current browser tab. */
export function visitSource(page: string, referrer: string, previous: string | null): string {
  const detected = detectLeadSource(page, referrer);
  const saved = leadSource(previous);
  if (saved === 'unknown' || !referrer) return detected;
  const current = new URL(page);
  if (leadSource(current.searchParams.get('utm_source')) !== 'unknown') return detected;
  try {
    return new URL(referrer).origin === current.origin ? saved : detected;
  } catch {
    return detected;
  }
}

export function rememberVisitSource(): string {
  const key = 'lala-visit-channel';
  try {
    const source = visitSource(location.href, document.referrer, sessionStorage.getItem(key));
    sessionStorage.setItem(key, source);
    return source;
  } catch {
    return detectLeadSource(location.href, document.referrer);
  }
}
