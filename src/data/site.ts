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
    bio: 'Bianca Ashley is the owner and gel manicurist behind La La Land Nail Hub.',
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
  hours: [],
  contact: null,
  bookingUrl: null,
  canonicalOrigin: 'https://lalalandnails.ca',
  approvedDomain: 'lalalandnails.ca',
  launchReady: false,
  analytics: {
    provider: 'plausible',
    domain: null,
  },
  services: [
    {
      name: 'European manicure',
      description: 'One specialty. One manicurist. Explore European manicures with Bianca, and share what you have in mind when you request your appointment.',
      priceDisplay: null,
      duration: null,
      availability: 'By appointment',
      inclusions: [],
      preparation: [],
      policyNotes: [],
    },
  ],
  process: [
    {
      number: '01',
      title: 'Share your preferred date',
      description: 'Share your preferred date and the part of the day that works for you.',
    },
    {
      number: '02',
      title: 'We review your request',
      description: 'Your request is checked before an appointment is confirmed.',
    },
    {
      number: '03',
      title: 'Hear back from La La Land',
      description: 'We’ll contact you using the details you provide. Your appointment is confirmed only after our follow-up.',
    },
  ],
  gallery: [],
  reviews: [],
  faqs: [
    { question: 'Where is La La Land Nail Hub based?', answer: 'La La Land Nail Hub is based in Scarborough, Toronto. We welcome appointment requests from Scarborough, Durham Region and the wider GTA. Appointments take place in Scarborough.' },
    { question: 'What can I book at La La Land?', answer: 'La La Land specializes in European manicure appointments with Bianca Ashley, the owner and gel manicurist. Tell Bianca about your current nails and the finish you have in mind when you send your request.' },
    { question: 'Can I visit from Pickering, Ajax or elsewhere in Durham?', answer: 'Yes. You can request an appointment if you are travelling from Durham Region or elsewhere in the GTA. The studio is in Scarborough; please confirm the appointment and visit details before arranging your journey.' },
    { question: 'How do I find out the price and appointment length?', answer: 'Include your preferred length, finish, any design ideas and whether you have product on your nails. Ask Bianca about the service, price and appointment length before confirming your visit.' },
    { question: 'Should I mention existing gel or extensions?', answer: 'Yes. Let Bianca know what is currently on your nails, including gel, extensions or another product. This helps you discuss the appropriate appointment and whether removal needs to be arranged.' },
    { question: 'Can I bring a Pinterest inspiration photo?', answer: 'Yes. Save a few references showing the shape, length, colour or detail you like. Describe your ideas in the request, then discuss the reference photos and what is achievable with Bianca before confirming.' },
    { question: 'Is my appointment confirmed when I submit the form?', answer: 'No. The form sends an appointment request. La La Land will follow up using the email address or phone number you provide before your appointment is confirmed.' },
    { question: 'Are the inspiration photos Bianca’s client work?', answer: 'The inspiration images currently shown are licensed stock photographs of real manicures. They are visual references, not Bianca’s portfolio or a promise of a particular result.' },
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
