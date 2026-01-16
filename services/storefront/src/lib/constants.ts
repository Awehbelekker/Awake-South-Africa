// ============================================
// Awake Boards SA - Image Assets Configuration
// Using official Awake images (can be replaced with custom uploads in Medusa Admin)
// ============================================

export const AWAKE_IMAGES = {
  // Logo
  logo: "https://awakeboards.com/cdn/shop/files/Awake_1200x1200.png?v=1613697127",

  // Hero Images
  hero: {
    main: "https://awakeboards.com/cdn/shop/files/BRABUSx3.png?v=1754380085",
  },

  // Product Categories
  categories: {
    jetboards: "https://awakeboards.com/cdn/shop/files/Ravik_ADVENTURE-22_1_1.png?v=1752232151",
    efoils: "https://awakeboards.com/cdn/shop/files/Vinga_ULTIMATE-26_1.png?v=1752232150",
    accessories: "https://awakeboards.com/cdn/shop/files/AwakeISO50Nvest.jpg?v=1746783055",
  },

  // Product Images (for product pages)
  products: {
    ravikS: "https://awakeboards.com/cdn/shop/files/Ravik_ADVENTURE-22_1_1.png?v=1752232151",
    ravik3: "https://awakeboards.com/cdn/shop/files/Ravik_ADVENTURE-22_1_1.png?v=1752232151",
    vinga2: "https://awakeboards.com/cdn/shop/files/Vinga_ULTIMATE-26_1.png?v=1752232150",
    brabusShadow: "https://awakeboards.com/cdn/shop/files/BRABUSx3.png?v=1754380085",
  },

  // RÄVIK Jetboards
  ravik: {
    explore: "https://awakeboards.com/cdn/shop/files/Ravik_ADVENTURE-22_1_1.png?v=1752232151",
    adventure: "https://awakeboards.com/cdn/shop/files/Ravik_ADVENTURE-22_1_1.png?v=1752232151",
    ultimate: "https://awakeboards.com/cdn/shop/files/Ravik_ADVENTURE-22_1_1.png?v=1752232151",
  },

  // VINGA eFoils
  vinga: {
    adventure: "https://awakeboards.com/cdn/shop/files/Vinga_ULTIMATE-26_1.png?v=1752232150",
    ultimate: "https://awakeboards.com/cdn/shop/files/Vinga_ULTIMATE-26_1.png?v=1752232150",
  },

  // BRABUS Limited Edition
  brabus: {
    shadowExplore: "https://awakeboards.com/cdn/shop/files/BRABUSx3.png?v=1754380085",
  },

  // Accessories
  accessories: {
    lifeVest: "https://awakeboards.com/cdn/shop/files/AwakeISO50Nvest.jpg?v=1746783055",
    batteryBackpack: "https://awakeboards.com/cdn/shop/files/Awake_cf66763e-fec1-45c2-944f-d9f5e22ae397.png?v=1752232003",
    beachMat: "https://awakeboards.com/cdn/shop/files/AWAKE-MATT.png?v=1753949058",
    carbonFins: "https://awakeboards.com/cdn/shop/files/CARBON_FINS.png?v=1746783193",
    wetsuit: "https://awakeboards.com/cdn/shop/files/FULL-SUIT-4_3_1000x1000_324a4676-bcc2-4eea-9220-3a8763a3efbc.jpg?v=1756381009",
    battery: "https://awakeboards.com/cdn/shop/files/Awake_cf66763e-fec1-45c2-944f-d9f5e22ae397.png?v=1752232003",
    charger: "https://awakeboards.com/cdn/shop/files/Awake_cf66763e-fec1-45c2-944f-d9f5e22ae397.png?v=1752232003",
  },
  
  // Lifestyle
  lifestyle: {
    riders: "https://awakeboards.com/cdn/shop/files/accessory-ladies_4.png?v=1752224160",
    action1: "https://awakeboards.com/cdn/shop/files/accessory-ladies_4.png?v=1752224160",
    action2: "https://awakeboards.com/cdn/shop/files/BRABUSx3.png?v=1754380085",
    sunset: "https://awakeboards.com/cdn/shop/files/Vinga_ULTIMATE-26_1.png?v=1752232150",
  },
} as const;

// South African specific content
export const SA_CONTENT = {
  company: {
    name: "Awake SA",
    legalName: "Awake Boards South Africa (Pty) Ltd",
    tagline: "The Future of Watersports in South Africa",
  },
  contact: {
    email: "info@awakesa.co.za",
    supportEmail: "awakesa-dot-co-dot-za@d5641ff5-d501-4a95-b7a6-c463d7eb55dc.mail.conversations.godaddy.com",
    phone: "+27 XXX XXX XXXX",
    whatsapp: "+27 XXX XXX XXXX",
  },
  address: {
    city: "Cape Town",
    province: "Western Cape",
    country: "South Africa",
  },
  social: {
    facebook: "https://www.facebook.com/awakesa",
    instagram: "https://www.instagram.com/awakesa",
    youtube: "https://www.youtube.com/@awakeboards",
  },
  currency: {
    code: "ZAR",
    symbol: "R",
    vatRate: 0.15,
  },
  demoLocations: [
    "Cape Town - V&A Waterfront",
    "Durban - uMhlanga",
    "Johannesburg - Hartbeespoort Dam",
    "Port Elizabeth",
  ],
  demo: {
    locations: [
      { name: "Cape Town", area: "V&A Waterfront" },
      { name: "Durban", area: "uMhlanga" },
      { name: "Johannesburg", area: "Hartbeespoort Dam" },
    ],
  },
};

// Product data with SA pricing
export const PRODUCTS = {
  jetboards: [
    { id: "ravik-explore", name: "RÄVIK Explore", price: 289000, image: AWAKE_IMAGES.ravik.explore },
    { id: "ravik-adventure", name: "RÄVIK Adventure", price: 349000, image: AWAKE_IMAGES.ravik.adventure },
    { id: "ravik-ultimate", name: "RÄVIK Ultimate", price: 419000, image: AWAKE_IMAGES.ravik.ultimate },
  ],
  efoils: [
    { id: "vinga-adventure", name: "VINGA Adventure", price: 319000, image: AWAKE_IMAGES.vinga.adventure },
    { id: "vinga-ultimate", name: "VINGA Ultimate", price: 389000, image: AWAKE_IMAGES.vinga.ultimate },
  ],
  limitedEdition: [
    { id: "brabus-shadow", name: "BRABUS x Awake SHADOW", price: 329000, image: AWAKE_IMAGES.brabus.shadowExplore, badge: "One of 77" },
  ],
};
