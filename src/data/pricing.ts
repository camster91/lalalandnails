/**
 * DRAFT pricing only. Values from the October 2026 pricing discussion are
 * proposals for owner review, NOT approved publication rates.
 * Keep this feature branch unmerged until Bianca confirms the catalogue.
 */
export const pricingDraft = {
  approved: false,
  currency: 'CAD',
  manicures: [
    { duration: '45–60 minutes', id: 'dry', name: 'European Dry Manicure', price: 45, description: 'Precision dry manicure preparation and natural nail shaping. No gel or colour.' },
    { duration: '75–90 minutes', id: 'gel-colour', name: 'European Gel Manicure', price: 60, description: 'Detailed dry manicure and an even application of solid gel colour, without builder reinforcement.' },
    { duration: '90–120 minutes', id: 'structured', name: 'Signature Structured Gel Manicure', price: 75, description: 'Detailed dry manicure, builder gel structure and one solid gel colour on short natural nails.' },
  ],
  fills: [
    { id: 'fill-short', name: 'Short structured gel fill', price: 70, detail: 'Removal of lifted product, structure rebalance, dry manicure, reshaping and a fresh solid colour.' },
    { id: 'fill-medium', name: 'Medium structured gel fill', price: 80, detail: 'Routine maintenance of an existing medium-length structured set.' },
    { id: 'fill-long', name: 'Long structured gel fill', price: 90, detail: 'Routine maintenance of an existing long structured set.' },
    { id: 'colour-refresh', name: 'Gel colour refresh', price: 60, detail: 'Colour service without builder-gel rebalance.' },
  ],
  lengths: [
    { name: 'Short', addOn: 0, detail: 'At or just beyond the fingertip.' },
    { name: 'Medium', addOn: 10, detail: 'Moderate natural free edge.' },
    { name: 'Long', addOn: 20, detail: 'Extended natural free edge.' },
    { name: 'Extra long', addOn: null, detail: 'By consultation, depending on natural-nail suitability.' },
  ],
  artTiers: [
    { name: 'Tier 1 — Minimal', addOn: 10, detail: 'Tiny hearts, dots, delicate lines, or one or two simple accent nails.' },
    { name: 'Tier 2 — Elevated', addOn: 20, detail: 'French tips, chrome, swirls or uncomplicated flowers.' },
    { name: 'Tier 3 — Detailed', addOn: 35, detail: 'Aura effects, tortoiseshell, detailed florals or layered designs.' },
    { name: 'Tier 4 — Bespoke', addOn: 50, startingAt: true, detail: 'Complex hand painting, sculpted 3D artwork or advanced custom sets. Quote after photo review.' },
  ],
  repairs: [
    { id: 'minor', name: 'Minor nail repair', price: 5, detail: 'Small gel chip or minor product damage, per nail.' },
    { id: 'structured', name: 'Structured gel repair', price: 10, detail: 'Cracked or compromised gel structure, per nail.' },
    { id: 'broken', name: 'Broken nail reconstruction', price: 15, detail: 'Rebuild a broken free edge where the natural nail is suitable, per nail.' },
    { id: 'colour', name: 'Single-nail colour fix', price: 5, detail: 'Fresh gel colour on one nail where the existing structure is intact, per nail.' },
  ],
  naturalMaintenance: {id:'maintenance',name:'Natural nail maintenance',price:45,detail:'Natural nail care and shaping, without gel.'},
  reconstructionTiers: [
    {id:'1',name:'Light reconstruction',price:10,detail:'Minor shape corrections, small missing corners and light structural rebuilding.'},
    {id:'2',name:'Moderate reconstruction',price:20,detail:'Uneven lengths, a few rebuilt free edges or moderate structural work.'},
    {id:'3',name:'Full reconstruction',price:35,detail:'Several rebuilt free edges and more extensive structural corrections.'},
    {id:'4',name:'Advanced reconstruction',price:50,detail:'Significant rebuilding across most of the set, with complex shaping or length restoration.'},
  ],
  standaloneRemoval: { name: 'Standalone gel removal', price: 25 },
  shapes: ['Round', 'Square', 'Squoval', 'Oval', 'Almond', 'Tapered square'],
} as const;

export const displayPrice = (value: number) => '$' + value;
