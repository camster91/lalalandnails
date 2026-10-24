export interface ContactMethod {
  type: 'email' | 'phone';
  label: string;
  href: `mailto:${string}` | `tel:${string}`;
}

export interface ServiceEntry {
  name: string;
  description: string;
  priceDisplay: string | null;
  duration: string | null;
  availability: string;
  inclusions: string[];
  preparation: string[];
  policyNotes: string[];
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface GalleryEntry {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ReviewEntry {
  quote: string;
  attribution: string;
  source: string;
  publicationApproved: boolean;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  businessName: string;
  legalName: string | null;
  specialty: string;
  provider: {
    name: string;
    role: string;
    bio: string;
    credentials: string[];
  };
  location: {
    displayName: string | null;
    streetAddress: string | null;
    locality: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
  };
  hours: string[];
  contact: ContactMethod | null;
  bookingUrl: string | null;
  canonicalOrigin: string;
  approvedDomain: string | null;
  launchReady: boolean;
  indexingEnabled: boolean;
  analytics: {
    provider: 'plausible';
    domain: string | null;
  };
  services: ServiceEntry[];
  process: ProcessStep[];
  gallery: GalleryEntry[];
  reviews: ReviewEntry[];
  faqs: FaqEntry[];
  policies: string[];
  socials: SocialLink[];
  googleBusinessUrl: string | null;
}

/**
 * Public facts live here so unapproved copy cannot leak into the interface.
 * Null or empty launch fields are intentionally not rendered by components.
 */
export const siteConfig: SiteConfig = {
  businessName: 'La La Land Nail Hub',
  legalName: null,
  specialty: 'European manicures',
  provider: {
    name: 'Bianca Ashley',
    role: 'Owner and gel manicurist',
    bio: 'Bianca Ashley is the owner and gel manicurist behind La La Land Nail Hub in Scarborough. You speak with Bianca directly about your nail ideas and appointment, from the first call or text through to your visit.',
    credentials: [],
  },
  location: {
    displayName: 'Scarborough, Toronto, Ontario',
    streetAddress: null,
    locality: 'Scarborough',
    region: 'ON',
    postalCode: null,
    country: 'CA',
  },
  hours: ['Monday–Friday · 10 a.m.–3 p.m. (Toronto time)'],
  contact: null,
  bookingUrl: null,
  canonicalOrigin: 'https://lalalandnails.ca',
  approvedDomain: 'https://lalalandnails.ca',
  launchReady: false,
  indexingEnabled: true,
  analytics: {
    provider: 'plausible',
    domain: null,
  },
  services: [
    {
      name: 'European manicure',
      description: 'European manicures with Bianca Ashley in Scarborough. Start with the shape, length and finish you love, whether you have a clear reference or need help explaining your ideas.',
      priceDisplay: null,
      duration: 'Two-hour request block',
      availability: 'One appointment per weekday',
      inclusions: [],
      preparation: [],
      policyNotes: [],
    },
  ],
  process: [
    {
      number: '01',
      title: 'Choose your two-hour block',
      description: 'Choose an available Monday–Friday date and start time between 10 a.m. and 1 p.m. Toronto time. Blocks finish by 3 p.m.',
    },
    {
      number: '02',
      title: 'Choose your service',
      description: 'Choose a manicure, length and nail-art tier, or ask Bianca to help. See an estimate before sending your request.',
    },
    {
      number: '03',
      title: 'Share your details & inspiration',
      description: 'Leave your name and number, choose a call or text back and optionally add inspiration. Bianca confirms your service, price and visit details.',
    },
  ],
  gallery: [],
  reviews: [],
  faqs: [
    { question: 'How do I request a European manicure in Scarborough?', answer: 'Choose an available two-hour block in the request calendar, choose your service, then leave your name and phone number and choose a call or text back. Requests are Monday–Friday within 10 a.m.–3 p.m. Toronto time, with one appointment per day. Bianca will confirm the service, price and visit details.' },
    { question: 'Where is La La Land Nail Hub based?', answer: 'La La Land Nail Hub is based in Scarborough, Toronto. We welcome appointment requests from Scarborough, Durham Region and the wider GTA. Appointments take place in Scarborough.' },
    { question: 'What can I book at La La Land?', answer: 'La La Land specializes in European manicure appointments with Bianca Ashley, the owner and gel manicurist. Tell Bianca about your current nails and the finish you have in mind when you send your request.' },
    { question: 'Can I visit from Pickering, Ajax or elsewhere in Durham?', answer: 'Yes. You can request an appointment if you are travelling from Durham Region or elsewhere in the GTA. The studio is in Scarborough; please confirm the appointment and visit details before arranging your journey.' },
    { question: 'How do I find out the price and appointment length?', answer: 'View the services and pricing menu, then choose your package, length and art in the request form for an estimate before applicable taxes. The calendar offers two-hour request blocks. Bianca reviews your choices and confirms the final price and timing before your appointment.' },
    { question: 'Should I mention existing gel or extensions?', answer: 'Yes. Let Bianca know what is currently on your nails, including gel, extensions or another product. This helps you discuss the appropriate appointment and whether removal needs to be arranged.' },
    { question: 'Can I bring a Pinterest inspiration photo?', answer: 'Yes. Add up to three public HTTPS inspiration links or two images in the optional inspiration section of your request. Show the shape, length, colour or detail you like; Bianca reviews what is achievable before confirming.' },
    { question: 'Is my appointment confirmed when I submit the form?', answer: 'No. Your submitted request reserves that day for review, with one appointment per day. Bianca will call or text to agree on the service, price and visit details before confirming your appointment.' },
    { question: 'Can I walk in without an appointment?', answer: 'La La Land works by appointment. Please send a request and agree on a confirmed time and visit details with Bianca before travelling to the studio.' },
    { question: 'Are the inspiration images Bianca’s client work?', answer: 'The inspiration images currently shown are AI-generated using real manicure references. They are visual ideas, not photographs of clients or the studio, Bianca’s portfolio, or a promise of a particular result.' },
  ],
  policies: [],
  socials: [],
  googleBusinessUrl: null,
};

const primaryService = siteConfig.services[0];

export const launchBlockers = [
  !siteConfig.contact && 'Fallback contact method',
  !siteConfig.approvedDomain && 'Approved public domain',
  !siteConfig.analytics.domain && 'Plausible domain',
  !siteConfig.location.displayName && 'Public location or service-area label',
  siteConfig.hours.length === 0 && 'Approved hours',
  !primaryService?.priceDisplay && 'Service price',
  !primaryService?.duration && 'Service duration',
  primaryService?.inclusions.length === 0 && 'Service inclusions',
  primaryService?.preparation.length === 0 && 'Appointment preparation',
  primaryService?.policyNotes.length === 0 && 'Service policy notes',
  siteConfig.faqs.length === 0 && 'Approved FAQ',
  siteConfig.policies.length === 0 && 'Approved policy summary',
  siteConfig.gallery.length === 0 && siteConfig.reviews.length === 0 && 'Permission-cleared portfolio work or review proof',
].filter((item): item is string => Boolean(item));

siteConfig.launchReady = launchBlockers.length === 0;

export const approvedReviews = siteConfig.reviews.filter((review) => review.publicationApproved);
