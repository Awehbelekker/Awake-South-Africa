// ============================================
// Awake Boards SA - Official Price List & Product Catalog
// Generated from AWAKE_PRICE_LIST_2025_COMPLETE.pdf
// Exchange Rate: R19.85/EUR | Margin: 35% | Updated: December 2025
// ============================================

export const AWAKE_IMAGES = {
  // Logo
  logo: "/images/awake-logo.png",

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

  // Product Images
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

  // BRABUS
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
    legalName: "Aweh Be Lekker (Pty) Ltd",
    tagline: "Exclusive Importer & Distributor",
    description: "Official South African distributor of Awake electric jetboards and eFoils",
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
  pricing: {
    exchangeRate: 19.85,
    margin: 0.35,
    vatRate: 0.15,
    note: "All prices include VAT. Customs duties vary by product category.",
  },
};

// Complete Product Catalog from Official Price List (December 2025)
export const PRODUCTS = {
  // 🏄 COMPLETE JETBOARDS (0% Duty)
  jetboards: [
    { 
      categoryTag: "Jetboard",
      id: "ravik-explore-xr4", 
      name: "RÄVIK Explore XR 4", 
      price: 241139, 
      priceExVAT: 209686,
      category: "jetboards",
      image: AWAKE_IMAGES.ravik.explore,
      battery: "XR 4 (65 min)",
      skillLevel: "Beginner",
      description: "Entry-level electric jetboard with impressive performance. Perfect for beginners and families.",
      specs: ["Max Speed: 50 km/h", "Battery: 65 min ride time", "Weight: 32 kg", "Carbon composite construction"],
      features: ["Intuitive hand controller", "Quick battery swap", "Durable construction"],
    },
    { 
      categoryTag: "Jetboard",
      id: "ravik-adventure-xr4", 
      name: "RÄVIK Adventure XR 4", 
      price: 349024, 
      priceExVAT: 303499,
      category: "jetboards",
      image: AWAKE_IMAGES.ravik.adventure,
      battery: "XR 4 (65 min)",
      skillLevel: "Intermediate",
      description: "Mid-range performance jetboard for enthusiasts. Perfect balance of power and versatility for expedition rides.",
      specs: ["Max Speed: 55 km/h", "Battery: 65 min ride time", "Weight: 32 kg", "Advanced motor system"],
      features: ["Enhanced power delivery", "Premium build quality", "Extended range"],
    },
    { 
      categoryTag: "Jetboard",
      id: "ravik-ultimate-xr4", 
      name: "RÄVIK Ultimate XR 4", 
      price: 402967, 
      priceExVAT: 350406,
      category: "jetboards",
      image: AWAKE_IMAGES.ravik.ultimate,
      battery: "XR 4 (65 min)",
      skillLevel: "Expert",
      description: "Top-tier performance electric jetboard. Engineered for experienced riders who demand peak performance and agility.",
      specs: ["Max Speed: 60 km/h", "Battery: 65 min ride time", "Weight: 32 kg", "Pro-level performance"],
      features: ["Maximum acceleration", "Carbon fiber components", "Competition ready"],
    },
  ],

  // 🏆 LIMITED EDITION
  limitedEdition: [
    { 
      categoryTag: "Limited Edition",
      id: "brabus-shadow", 
      name: "BRABUS Shadow", 
      price: 452216, 
      priceExVAT: 393231,
      category: "jetboards",
      image: AWAKE_IMAGES.brabus.shadowExplore, 
      badge: "Limited Edition",
      battery: "XR 4 (65 min)",
      skillLevel: "Expert",
      description: "Exclusive BRABUS collaboration - luxury meets performance. One of 77 limited edition boards.",
      specs: ["Max Speed: 60 km/h", "Exclusive BRABUS Design", "Carbon Fiber", "Premium finishes"],
      features: ["Numbered limited edition", "Signature BRABUS styling", "Collector's item"],
    },
  ],

  // 🪁 COMPLETE eFOILS (0% Duty)
  efoils: [
    { 
      categoryTag: "eFoil",
      id: "vinga-adventure-lr4", 
      name: "VINGA Adventure LR 4", 
      price: 322052, 
      priceExVAT: 280045,
      category: "efoils",
      image: AWAKE_IMAGES.vinga.adventure,
      battery: "LR 4 (90 min)",
      skillLevel: "Beginner to Intermediate",
      description: "Extended range eFoil for long sessions. Perfect for learning and exploring.",
      specs: ["Max Speed: 40 km/h", "Battery: 90 min ride time", "Silent operation", "Stable foil design"],
      features: ["Long battery life", "Easy to learn", "Smooth ride"],
    },
    { 
      categoryTag: "eFoil",
      id: "vinga-adventure-xr4", 
      name: "VINGA Adventure XR 4", 
      price: 362509, 
      priceExVAT: 315225,
      category: "efoils",
      image: AWAKE_IMAGES.vinga.adventure,
      battery: "XR 4 (65 min)",
      skillLevel: "Intermediate",
      description: "Performance-focused eFoil with XR battery. Enhanced stability and range for longer explorations.",
      specs: ["Max Speed: 40 km/h", "Battery: 65 min ride time", "Silent operation", "Responsive control"],
      features: ["Compact battery", "Travel-friendly", "Precision handling"],
    },
    { 
      categoryTag: "eFoil",
      id: "vinga-ultimate-lr4", 
      name: "VINGA Ultimate LR 4", 
      price: 349024, 
      priceExVAT: 303499,
      category: "efoils",
      image: AWAKE_IMAGES.vinga.ultimate,
      battery: "LR 4 (90 min)",
      skillLevel: "Intermediate to Expert",
      description: "Advanced eFoil with extended ride time. Advanced performance and dynamic control.",
      specs: ["Max Speed: 45 km/h", "Battery: 90 min ride time", "Advanced control", "Premium wings"],
      features: ["High performance", "Long sessions", "Professional grade"],
    },
    { 
      categoryTag: "eFoil",
      id: "vinga-ultimate-xr4", 
      name: "VINGA Ultimate XR 4", 
      price: 389481, 
      priceExVAT: 338679,
      category: "efoils",
      image: AWAKE_IMAGES.vinga.ultimate,
      battery: "XR 4 (65 min)",
      skillLevel: "Expert",
      description: "Top-spec eFoil with ultimate performance. For those seeking peak performance and control.",
      specs: ["Max Speed: 45 km/h", "Battery: 65 min ride time", "Advanced control", "Carbon construction"],
      features: ["Maximum speed", "Precision foiling", "Competition ready"],
    },
      battery: "XR 4 (65 min)",
      description: "Top-spec eFoil with ultimate performance",
      specs: ["Max Speed: 45 km/h", "Battery: 65 min ride time", "Advanced control", "Carbon construction"],
      features: ["Maximum speed", "Precision foiling", "Competition ready"],
    },
  ],

  // 🔋 BATTERIES (0% Duty)
  batteries: [
    { 
      id: "flex-battery-lr4", 
      name: "Flex Battery LR 4", 
      price: 78765, 
      priceExVAT: 68491, 
      category: "batteries",
      image: AWAKE_IMAGES.accessories.battery,
      description: "Long range battery - 90 minutes ride time",
      specs: ["90 min runtime", "Quick swap design", "LED indicators"],
    },
    { 
      id: "flex-battery-xr4", 
      name: "Flex Battery XR 4", 
      price: 121918, 
      priceExVAT: 106016, 
      category: "batteries",
      image: AWAKE_IMAGES.accessories.battery,
      description: "Extended range battery - 65 minutes ride time",
      specs: ["65 min runtime", "Compact design", "Fast charging"],
    },
  ],

  // 📦 BOARDS ONLY (0% Duty)
  boardsOnly: [
    { id: "ravik-explore-board", name: "RÄVIK Explore (Board Only)", price: 132934, priceExVAT: 115595, category: "boards", image: AWAKE_IMAGES.ravik.explore, description: "Board without battery" },
    { id: "ravik-adventure-board", name: "RÄVIK Adventure (Board Only)", price: 213847, priceExVAT: 185954, category: "boards", image: AWAKE_IMAGES.ravik.adventure, description: "Board without battery" },
    { id: "ravik-ultimate-board", name: "RÄVIK Ultimate (Board Only)", price: 240819, priceExVAT: 209408, category: "boards", image: AWAKE_IMAGES.ravik.ultimate, description: "Board without battery" },
    { id: "vinga-adventure-board", name: "VINGA Adventure (Board Only)", price: 240819, priceExVAT: 209408, category: "boards", image: AWAKE_IMAGES.vinga.adventure, description: "Board without battery" },
    { id: "vinga-ultimate-board", name: "VINGA Ultimate (Board Only)", price: 254305, priceExVAT: 221135, category: "boards", image: AWAKE_IMAGES.vinga.ultimate, description: "Board without battery" },
  ],

  // 🪁 eFOIL WING KITS (0% Duty)
  wings: [
    { id: "cruise-1600", name: "CRUISE 1600 Wing Kit", price: 27168, priceExVAT: 23624, category: "wings", image: AWAKE_IMAGES.accessories.carbonFins, description: "Cruising wing for stable rides" },
    { id: "powder-1800", name: "POWDER 1800 Wing Kit", price: 27168, priceExVAT: 23624, category: "wings", image: AWAKE_IMAGES.accessories.carbonFins, description: "Powder conditions wing" },
    { id: "powder-1400", name: "POWDER 1400 Wing Kit", price: 27168, priceExVAT: 23624, category: "wings", image: AWAKE_IMAGES.accessories.carbonFins, description: "Compact powder wing" },
    { id: "fluid-1300", name: "FLUID 1300 Wing Kit", price: 27168, priceExVAT: 23624, category: "wings", image: AWAKE_IMAGES.accessories.carbonFins, description: "Fluid performance wing" },
    { id: "fluid-1000", name: "FLUID 1000 Wing Kit", price: 27168, priceExVAT: 23624, category: "wings", image: AWAKE_IMAGES.accessories.carbonFins, description: "High speed wing" },
  ],

  // 🎒 BAGS (20% Duty)
  bags: [
    { id: "board-bag-kit", name: "Board Bag Kit", price: 19406, priceExVAT: 16875, category: "accessories", image: AWAKE_IMAGES.accessories.batteryBackpack, description: "Protective bag for RÄVIK/VINGA" },
    { id: "battery-bag", name: "Battery Bag", price: 9620, priceExVAT: 8365, category: "accessories", image: AWAKE_IMAGES.accessories.batteryBackpack, description: "Dedicated battery storage" },
    { id: "premium-travel-bag", name: "Premium Travel Bag", price: 16169, priceExVAT: 14060, category: "accessories", image: AWAKE_IMAGES.accessories.batteryBackpack, description: "Luxury travel case" },
  ],

  // 🛡️ SAFETY & STORAGE (20% Duty)
  safetyStorage: [
    { id: "life-vest", name: "Life Vest (CE Certified)", price: 9620, priceExVAT: 8365, category: "accessories", image: AWAKE_IMAGES.accessories.lifeVest, description: "Safety vest meeting CE standards" },
    { id: "awake-dock", name: "Awake Dock (Floating)", price: 78298, priceExVAT: 68085, category: "accessories", image: AWAKE_IMAGES.accessories.beachMat, description: "Floating dock system" },
    { id: "wall-mount", name: "Wall Mount", price: 29518, priceExVAT: 25668, category: "accessories", image: AWAKE_IMAGES.accessories.beachMat, description: "Wall mounting bracket" },
    { id: "board-stand", name: "Board Stand", price: 16169, priceExVAT: 14060, category: "accessories", image: AWAKE_IMAGES.accessories.beachMat, description: "Display stand" },
  ],

  // 🎮 ELECTRONICS (0% Duty)
  electronics: [
    { id: "hand-controller", name: "Flex Hand Controller", price: 16224, priceExVAT: 14108, category: "accessories", image: AWAKE_IMAGES.accessories.charger, description: "Wireless hand controller" },
    { id: "battery-charger", name: "Battery Charger", price: 24662, priceExVAT: 21445, category: "accessories", image: AWAKE_IMAGES.accessories.charger, description: "Fast battery charger" },
    { id: "controller-charger", name: "Controller Charger", price: 5628, priceExVAT: 4894, category: "accessories", image: AWAKE_IMAGES.accessories.charger, description: "Controller charging cable" },
  ],

  // ⚙️ PARTS (0% Duty)
  parts: [
    { id: "ravik-fins", name: "RÄVIK Fins (Set of 3)", price: 5628, priceExVAT: 4894, category: "accessories", image: AWAKE_IMAGES.accessories.carbonFins, description: "Standard fin set" },
    { id: "carbon-fins", name: "Carbon Fins (Set of 3)", price: 8055, priceExVAT: 7004, category: "accessories", image: AWAKE_IMAGES.accessories.carbonFins, description: "Premium carbon fiber fins" },
    { id: "foot-straps", name: "Foot Straps", price: 8325, priceExVAT: 7239, category: "accessories", image: AWAKE_IMAGES.accessories.beachMat, description: "Adjustable foot straps" },
    { id: "beach-mat", name: "Beach Mat", price: 5614, priceExVAT: 4882, category: "accessories", image: AWAKE_IMAGES.accessories.beachMat, description: "Portable beach mat" },
  ],

  // 👕 APPAREL (45% Duty)
  apparel: [
    { id: "tshirt", name: "Awake T-shirt", price: 3283, priceExVAT: 2855, category: "apparel", image: AWAKE_IMAGES.lifestyle.riders, description: "Official Awake branded tee" },
    { id: "cap", name: "Awake Cap", price: 1689, priceExVAT: 1469, category: "apparel", image: AWAKE_IMAGES.lifestyle.riders, description: "Branded cap" },
  ],
};
