import { pricingDraft } from './pricing.ts';

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
  specialty: 'European/Russian-style manicures and structured gel',
  provider: {
    name: 'Bianca Ashley',
    role: 'Owner and gel manicurist',
    bio: 'Bianca Ashley is the owner and gel manicurist behind La La Land Nail Hub in Scarborough. Discuss your preferred shape, everyday nail length and design with the person who will carry out your manicure. Bianca reviews your service choices and inspiration, then agrees the final price and visit details with you.',
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
      name: 'European manicures and natural-nail structured gel',
      description: 'European/Russian-style dry manicures with Bianca in Scarborough. Choose detailed natural-nail care, gel colour or a structured builder-gel overlay. Returning clients can request fills, maintenance or nail repairs.',
      priceDisplay: pricingDraft.approved ? 'From $' + pricingDraft.manicures[0].price + ' CAD' : null,
      duration: 'Two-hour request block',
      availability: 'One appointment per weekday',
      inclusions: [
        'Careful dry manicure preparation and natural nail shaping.',
        'Your chosen finish: natural nails, gel colour or a structured builder-gel overlay.',
        'An estimated total before Bianca confirms the final service and price.',
      ],
      preparation: [
        'Choose an available two-hour request block, then select your service and optional extras.',
        'You can add nail inspiration photos/links and mention any existing gel or extensions.',
      ],
      policyNotes: [
        'Submitting a request is not a confirmed appointment.',
        'Bianca checks suitability, final price and visit details before confirming.',
      ],
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
    { question: 'What can I book at La La Land Nail Hub?', answer: 'Choose a European dry manicure, gel manicure or structured gel manicure for your natural nails. The menu also includes fills, natural nail maintenance, gel removal, nail art and suitable repairs. Your appointment is with Bianca Ashley in Scarborough.' },
    { question: 'What is the difference between a European manicure and structured gel?', answer: 'European-style dry manicure preparation focuses on cuticle care and nail shaping. Our dry manicure has no polish; our gel manicure adds solid gel colour. A structured gel manicure adds a builder-gel overlay and solid colour to your natural nails. The structured service does not create nail extensions.' },
    { question: 'What are your manicure prices?', answer: `Our introductory European dry manicure is $${pricingDraft.manicures[0].price} CAD, European gel manicure $${pricingDraft.manicures[1].price} CAD and Signature Structured Gel Manicure $${pricingDraft.manicures[2].price} CAD with short length and solid colour. Medium or long length, nail art and necessary repairs can cost extra. Prices are before applicable taxes; Bianca confirms your final quote.` },
    { question: 'Where is the studio, and can I visit from Durham Region?', answer: 'La La Land Nail Hub is in Scarborough, Toronto, Ontario. Clients from Pickering, Ajax, Whitby, Durham Region and the wider GTA are welcome to request an appointment. All appointments take place in Scarborough; confirm your visit details with Bianca before travelling.' },
    { question: 'What appointment times can I request?', answer: 'Request a two-hour block starting at 10 a.m., 11 a.m., noon or 1 p.m., Monday–Friday, Toronto time. Blocks finish by 3 p.m., with one appointment per day. The calendar shows available dates; Bianca reviews whether your chosen service and design fit the requested time.' },
    { question: 'How do I request an appointment, and is it confirmed straight away?', answer: 'Choose an available time, select a service and send your name, phone number and call-or-text preference. You can ask Bianca to help you choose a service. No online payment is taken. Your submitted request holds the day for review; the appointment is confirmed only after Bianca agrees the service, final price and visit details with you.' },
    { question: 'Can I request a fill with gel from another nail technician?', answer: 'Tell Bianca what product is on your nails and who applied it. Product from another technician needs assessment before a fill is accepted; removal and a new application may be more suitable. The service menu shows separate prices for fills, removal and repairs.' },
    { question: 'Can I add Pinterest inspiration links or nail images?', answer: 'Yes. Add up to three public HTTPS links or two images in the optional inspiration section. A shape, colour or detail is enough to start the discussion. Images are shared privately with authorised studio staff, and Bianca confirms what is achievable before your appointment.' },
    { question: 'Do you accept walk-ins?', answer: 'La La Land works by appointment. Use the request calendar and wait for Bianca to confirm your time and visit details before travelling to the studio.' },
    { question: 'Are the website images Bianca’s client work?', answer: 'The manicure inspiration images currently shown are AI-generated using real manicure references. They show ideas for colour, shape and finish; they are not client photographs, Bianca’s portfolio or photographs of the studio.' },
  ],
  policies: [
    'Appointments are requests until Bianca confirms the service, price and visit details.',
    'Prices are in CAD; length, nail art and necessary repairs may add to the estimate. Applicable taxes are additional where required.',
    'Mention existing gel or extensions when choosing a fill, removal or nail repair.',
    'Inspiration links and images are optional and used privately for your appointment discussion.',
  ],
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

export const homeMetadata = {
  title: 'European & Structured Gel Nails in Scarborough | La La Land',
  description: `European dry manicures from $${pricingDraft.manicures[0].price} CAD and structured gel from $${pricingDraft.manicures[2].price} CAD in Scarborough. Compare services and request a weekday appointment with Bianca.`,
};
