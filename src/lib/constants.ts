// Awake Boards SA — site constants & re-exports
// Product catalog: src/lib/catalog/ (Jul 2026 distributor-cost model)

import { DEFAULT_EUR_ZAR_RATE, DISTRIBUTOR_DISCOUNT, RETAIL_MARGIN, VAT_RATE } from './catalog/pricing'
import { getProductGroups } from './catalog'

export { AWAKE_IMAGES } from './awake-images'
export { getFlatCatalogProducts, getCatalogProductById, getCompareProducts, getCategoryStartingPrice, formatZarPrice } from './catalog'

export const SA_CONTENT = {
  company: {
    name: 'Awake SA',
    legalName: 'Aweh Be Lekker (Pty) Ltd',
    tagline: 'Exclusive Importer & Distributor',
    description: 'Official South African distributor of Awake electric jetboards and eFoils',
  },
  contact: {
    email: 'info@awakesa.co.za',
    supportEmail:
      'awakesa-dot-co-dot-za@d5641ff5-d501-4a95-b7a6-c463d7eb55dc.mail.conversations.godaddy.com',
    phone: '+27 64 575 5210',
    whatsapp: '+27 64 575 5210',
  },
  address: {
    city: 'Cape Town',
    province: 'Western Cape',
    country: 'South Africa',
  },
  social: {
    facebook: 'https://www.facebook.com/awake.southafrica2025',
    instagram: 'https://www.instagram.com/awake.southafrica',
    youtube: 'https://www.youtube.com/@awakeboards',
  },
  currency: {
    code: 'ZAR',
    symbol: 'R',
    vatRate: VAT_RATE,
  },
  demoLocations: [
    'Langebaan',
    'Melkbosstrand',
    'Eden on the Bay',
    'MAC Club',
    'V&A Waterfront',
    'Clifton Beach',
    'Llandudno Beach',
  ],
  demo: {
    locations: [
      { name: 'Langebaan', area: 'West Coast', image: '/images/demo/langebaan.svg' },
      { name: 'Melkbosstrand', area: 'Cape Town', image: '/images/demo/melkbosstrand.svg' },
      { name: 'Eden on the Bay', area: 'Cape Town', image: '/images/demo/eden-on-the-bay.svg' },
      { name: 'MAC Club', area: 'Milnerton', image: '/images/demo/mac-club.svg' },
      { name: 'V&A Waterfront', area: 'Cape Town', image: '/images/demo/va-waterfront.svg' },
      { name: 'Clifton Beach', area: 'Atlantic Seaboard', image: '/images/demo/clifton-beach.svg' },
      { name: 'Llandudno Beach', area: 'Atlantic Seaboard', image: '/images/demo/llandudno-beach.svg' },
    ],
  },
  pricing: {
    /** @deprecated Use getEurZarRate() — kept for admin settings UI */
    exchangeRate: DEFAULT_EUR_ZAR_RATE,
    distributorDiscount: DISTRIBUTOR_DISCOUNT,
    margin: RETAIL_MARGIN,
    vatRate: VAT_RATE,
    note:
      'Illustrative ZAR prices from EU retail minus 20% distributor discount. Freight, duty, and clearance not included — confirm landed costs before publishing final sell prices.',
  },
}

/** Grouped product catalog (computed from EU retail + EUR_ZAR_RATE) */
export const PRODUCTS = getProductGroups()
