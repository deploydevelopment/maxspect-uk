// Supabase client helper with graceful fallback to local mock storage
// when process.env.SUPABASE_URL is not set.

import { ProductCategory, ProductPage, Stockist, SparePart } from "./catalog.types";

export interface SyncStatus {
  lastSyncAt: string | null;
  pendingDraftsCount: number;
  scrapedCount: number;
  isSyncing: boolean;
}

// Default fallback catalog data (seeds local state if database is unlinked)
export const DEFAULT_CATEGORIES: ProductCategory[] = [
  {
    id: "cat-1",
    slug: "innovate-series",
    name: "Innovate Series",
    description:
      "Cutting-edge flagship marine technology engineered for ultra-demanding reef aquariums.",
    image_url:
      "/media/images/Products/Innovate/gyre-300-ce/Gyre_300_CE_mainpic.png",
    sort_order: 1,
  },
  {
    id: "cat-2",
    slug: "jump-series",
    name: "Jump Series",
    description:
      "High-performance, accessible reef gear designed for aquarists stepping up their game.",
    image_url:
      "/media/images/Products/Jump/MJ-SKSeries/sk2000.jpg",
    sort_order: 2,
  },
  {
    id: "cat-3",
    slug: "nano-tech-bio-media",
    name: "Nano-Tech & Bio\u2011Media",
    description:
      "Ultra-high surface area bio-substrates for biological filtration and water clarity.",
    image_url:
      "/media/images/Products/Nano-tech/cubelets/biomedia3in1.jpg",
    sort_order: 3,
  },
  {
    id: "cat-6",
    slug: "smart-aquarium",
    name: "Smart Aquarium",
    description: "All-in-one aquariums and the Lagoon system.",
    sort_order: 6,
  },
  {
    id: "cat-7",
    slug: "accessories",
    name: "Accessories",
    description: "Artwork and extras.",
    sort_order: 7,
  },
];

export const DEFAULT_PRODUCTS: ProductPage[] = [
  {
    id: "prod-gyre-300-ce",
    category_id: "cat-1",
    slug: "gyre-300-cloud-edition",
    title: "Gyre 300 Cloud Edition",
    subtitle: "Multi-directional patented cross-flow water movement with Cloud WiFi control.",
    hero_image:
      "/media/images/Products/Innovate/gyre-300-ce/Gyre_300_CE_mainpic.png",
    hero_badge: "REVOLUTIONARY MULTI-DIRECTIONAL WATER FLOW",
    gallery_images: [
      "/media/images/Products/Innovate/gyre-300-ce/Gyre_300_CE_mainpic.png",
      "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-3rd_rowb.png",
      "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-hero.png",
    ],
    sections: [
      {
        id: "sec-full-hero-gyre300",
        type: "full_width_hero",
        heading: "Revolutionary Multi-Directional Water Flow",
        subheading:
          "Patented cross-flow technology delivering unmatched laminar circulation across your reef.",
        image_url:
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-hero.png",
        overlay_images: [
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-ce-300-logo.png",
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/3_logos_hero.png",
        ],
      },
      {
        id: "sec-gyre300-video-1",
        type: "video_embed",
        heading: "Cloud Controller & App Setup",
        subheading:
          "Control your Gyre pumps anywhere around the world over the Cloud with our Syna-G Cloud app.",
        video_url:
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/01_Controller_App_Video-1.mp4",
        video_title: "Maxspect Gyre 300 Cloud Edition — Controller & App Setup",
      },
      {
        id: "sec-cloud-cntrl",
        type: "feature_block",
        heading: "The All-New Gyre Advanced Cloud Controller",
        subheading:
          'Featuring a large 3.2" TFT LCD color display, complete gyre circulation status within your aquarium at a glance.',
        image_url:
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-3rd_rowb.png",
        items: [
          {
            title: "Warning Indicators",
            description: "Real-time motor block or overheating alert sensors.",
          },
          {
            title: "Main Menu Navigation",
            description: "Intuitive touch & dial access to all system parameters.",
          },
          {
            title: "Pump A Water Flow Status",
            description: "Live real-time output gauge and flow direction indicator.",
          },
          {
            title: "Pump A Movement Pattern",
            description: "Current active preset or custom schedule mode.",
          },
          {
            title: "Pump B Movement Pattern",
            description: "Synchronized or independent secondary pump profile.",
          },
          {
            title: "Pump B Water Flow Status",
            description: "Independent live power and flow gauge.",
          },
          {
            title: "Cloud Enabled",
            description: "Direct Syna-G Cloud wireless integration active indicator.",
          },
          {
            title: "Time & Wi-Fi Status",
            description: "Live network telemetry and synchronized time clock.",
          },
        ],
      },
      {
        id: "sec-presets",
        type: "feature_block",
        heading: "Now Comes with Over 20 Water Pattern Presets",
        subheading:
          "Easily choose the ideal water pattern for your aquarium with a touch of a button, without any programming needed.",
        image_url:
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-4th_1.png",
        secondary_images: [
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-4th_2.png",
        ],
      },
      {
        id: "sec-flow-cages",
        type: "diagram_callout",
        heading: "Experience the Revolutionary Multi-Directional Water Flow",
        subheading:
          "The flow cages and clip-on directors have undergone a complete overhaul, now with 4 sides horizontal and vertical flow directions.",
        image_url:
          "/media/images/Products/Innovate/gyre-300-ce/gyre-300-ce-6th1c.png",
        secondary_images: [
          "/media/images/Products/Innovate/gyre-300-ce/gyre-300-ce-6th2c.png",
          "/media/images/Products/Innovate/gyre-300-ce/gyre-300-ce-6th3b.png",
        ],
      },
      {
        id: "sec-gyre300-tank-video",
        type: "video_embed",
        heading: "In-Tank Water Movement Demonstration",
        subheading:
          "Full-width demonstration showing Gyre cross-flow turbulence in an active reef aquarium.",
        video_url:
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre_300_ce_4.mp4",
        video_title: "Maxspect Gyre 300 Cloud Edition — Full Tank Circulation Video",
      },
      {
        id: "sec-gyre300-video-2",
        type: "video_embed",
        heading: "Experience Multi-Directional Water Flow in Action",
        subheading:
          "Watch how the 4-side directional cages propel turbulent laminar water currents across the entire aquarium.",
        video_url:
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/02_Gyre_Pump_Video-1.mp4",
        video_title: "Maxspect Gyre 300 Cloud Edition — Multi-Directional Water Flow Demo",
      },
      {
        id: "sec-improve-flow",
        type: "water_flow_improvement",
        heading: "How to Improve on the Gyre 300 Series Already Excellent Water Flow",
        subheading:
          "Try to mix-and-match the following flow options to create the ideal flow pattern for your aquarium. Whereas there are 4 sides on Gyre 300 Cloud Edition.",
        image_url:
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-7th1.png",
        items: [
          {
            title: "Straight Flow",
            description: "Direct linear current across the full length of the tank.",
            image_url:
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-8th1.png",
          },
          {
            title: "Swing Left",
            description: "Angled left sweep to eliminate corner dead zones.",
            image_url:
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-8th2.png",
          },
          {
            title: "Swing Right",
            description: "Angled right sweep for asymmetric reef circulation.",
            image_url:
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-8th3.png",
          },
          {
            title: "Wide Flow",
            description: "Diffused 120° output for soft coral fan expansion.",
            image_url:
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-8th4.png",
          },
          {
            title: "Spot Flow",
            description: "Concentrated high-velocity jet targeting dense SPS colonies.",
            image_url:
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-8th5.png",
          },
        ],
      },
      {
        id: "sec-flow-examples",
        type: "flow_examples",
        heading: "Examples of Water Flow Patterns",
        subheading:
          "Here are just a few samples of what kind of unique water flow patterns can be created in your aquarium.",
        video_url:
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre_300_ce_3.mp4",
        video_title: "Maxspect Gyre 300 Cloud Edition — Water Flow Pattern Examples",
        items: [
          {
            title: "Even Vertical Circulation",
            description:
              "Wide and spot horizontal water flow from left & right outlets driving circular vertical currents.",
            image_url:
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-10th1.png",
            secondary_images: [
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-10th2.png",
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-10tha.png",
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-10thb.png",
            ],
          },
          {
            title: "Uneven Water Circulation",
            description:
              "Swing left and swing right horizontal water flow creating dynamic surge and tide motions.",
            image_url:
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-10th3.png",
            secondary_images: [
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-10th4.png",
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-10tha.png",
              "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-10thb.png",
            ],
          },
        ],
      },
      {
        id: "sec-tech-comparison",
        type: "tech_specs_table",
        heading: "Model Specifications: XF330 vs XF350 Cloud Edition",
        subheading: "Detailed technical comparison between standard and high-capacity pump models.",
        image_url:
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-11th1.png",
        secondary_images: [
          "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-11th2.png",
        ],
        specs_table: {
          "Power Consumption": { XF330: "5 - 35 W", XF350: "5 - 52 W" },
          "Flow Rate": { XF330: "9,000 L/h (2,377 US GPH)", XF350: "20,000 L/h (5,283 US GPH)" },
          "Suitable for Aquarium": {
            XF330: "100 - 500 L / 26-132 Gal",
            XF350: "300 - 3,000 L / 79-792 Gal",
          },
          "Power Supply": { XF330: "100-240V / 50-60Hz", XF350: "100-240V / 50-60Hz" },
          Dimensions: { XF330: "265 x 65 x 34 mm", XF350: "325 x 75 x 38 mm" },
          "Weight (Pump unit)": { XF330: "575g / 20.3oz", XF350: "645g / 22.8oz" },
          "Cable: Pump to Controller": { XF330: "3m / 9.8ft", XF350: "3m / 9.8ft" },
          "Cable: PSU to Controller": { XF330: "1.5m / 4.9ft", XF350: "1.5m / 4.9ft" },
          "Glass Thickness: Standard": { XF330: '15mm / 0.59"', XF350: '20mm / 0.79"' },
          "Glass Thickness: Reinforced": { XF330: '20mm / 0.79"', XF350: '25mm / 0.98"' },
        },
      },
    ],
    features: [
      {
        title: "Cross-Flow Technology",
        description: "Eliminates dead spots with laminar water movement across full tank width.",
      },
      {
        title: "Cloud Controller",
        description: "Control via Syna-G Cloud app with customizable 24-hour flow schedules.",
      },
      {
        title: "Silent Sine Wave Drivers",
        description: "Near-silent operation with advanced sine wave motor dampening.",
      },
    ],
    specs: {
      "Flow Rate": "up to 20,000 L/h",
      "Power Consumption": "52W",
      "Recommended Tank Size": "200 - 1000 Litres",
      "Glass Thickness": "up to 20 mm",
    },
    downloads: [
      { name: "User Manual (PDF)", url: "#", type: "pdf" },
      { name: "Syna-G Setup Guide", url: "#", type: "pdf" },
    ],
    status: "published",
    source_url: "https://www.maxspect.com/en/innovate-series/617-gyre-300-ce",
    last_scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-aeraqua-duo",
    category_id: "cat-1",
    slug: "aeraqua-duo-protein-skimmer",
    title: "Aeraqua Duo Protein Skimmer",
    subtitle: "Dual-intake dual-needle wheel technology for intense waste removal.",
    hero_image:
      "/media/images/Products/Jump/MJ-SKSeries/sk2000.jpg",
    gallery_images: [
      "/media/images/Products/Jump/MJ-SKSeries/sk2000.jpg",
    ],
    features: [
      {
        title: "Dual-Needle Wheel Impeller",
        description: "Micro-bubble production maximized for ultra-dense foam fractioning.",
      },
      {
        title: "Integrated Silencer",
        description: "Whisper-quiet air intake housed directly within the skimmer base.",
      },
      {
        title: "Smart Overflow Prevention",
        description: "Built-in sensor automatically reduces pump speed if collection cup fills.",
      },
    ],
    specs: {
      Footprint: "260 x 210 mm",
      Height: "565 mm",
      "Air Intake": "1,500 L/h",
      "Recommended Tank": "500 - 1500 Litres",
    },
    downloads: [{ name: "Aeraqua Duo Manual", url: "#", type: "pdf" }],
    status: "published",
    source_url: "https://www.maxspect.com/en/innovate-series/596-aeraqua-duo-protein-skimmer",
    last_scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-mj-sk200",
    category_id: "cat-2",
    slug: "mj-sk-gen-2-protein-skimmer",
    title: "MJ-SK Gen 2 Protein Skimmers",
    subtitle: "Compact, efficient skimmers engineered with fine-tune precision adjustment.",
    hero_image:
      "/media/images/Products/Jump/MJ-SKSeries/sk2000.jpg",
    gallery_images: [
      "/media/images/Products/Jump/MJ-SKSeries/sk2000.jpg",
    ],
    features: [
      {
        title: "Dual Intake System",
        description: "Draws water from both sides for optimum contact time.",
      },
    ],
    specs: {
      "Air Intake": "550 L/h",
      Power: "20W",
    },
    downloads: [],
    status: "published",
    source_url: "https://www.maxspect.com/en/mj-sk200series",
    last_scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-ethereal-infinite",
    category_id: "cat-1",
    slug: "ethereal-infinite",
    title: "Ethereal Infinite LED System",
    subtitle:
      "Modular full-spectrum 230W LED lighting with rimless optical diffusion, 18 ambient RGB mood modes, and redundant 276-LED chip architecture.",
    hero_image:
      "/media/images/Products/Innovate/ethereal%20infinite/frontpage111.jpg",
    gallery_images: [
      "/media/images/Products/Innovate/ethereal%20infinite/frontpage111.jpg",
    ],
    sections: [
      {
        id: "sec-ethereal-hero",
        type: "full_width_hero",
        heading: "Ethereal Infinite LED System",
        subheading:
          "More than meets the eye — 230W PAR Powerhouse with customizable mood illumination & redundant LED architecture.",
        image_url:
          "/media/images/Products/Innovate/ethereal%20infinite/frontpage111.jpg",
        overlay_images: [
          "/media/images/Products/Innovate/ethereal%20infinite/Ethereal_logo.webp",
        ],
      },
      {
        id: "sec-ethereal-video-hero",
        type: "video_embed",
        heading: "Ethereal Infinite — Feature Showcase",
        subheading:
          "Watch the Ethereal Infinite LED system in action with 18 RGB ambient illumination modes and Syna-G Cloud control.",
        video_url:
          "https://www.maxspect.com/images/Products/Innovate/ethereal%20infinite/Ethereal_Infinite.mp4",
        video_title: "Ethereal Infinite LED System Video",
      },
    ],
    features: [
      {
        title: "276 Redundant LED Chips",
        description: "Operates at 230W draw for maximum lifespan and color spectrum control.",
      },
      {
        title: "18 Ambient RGB Light Modes",
        description: "Customizable mood lighting perimeter that syncs with music beats.",
      },
      {
        title: "Global Coral Habitat Presets",
        description: "Simulates Great Barrier Reef, Bali, Palawan, Sabah & Okinawa light curves.",
      },
    ],
    specs: {
      Wattage: "230W (E8-230) / 150W (E8-150)",
      LEDs: "276 High-Efficiency Diodes",
      Dimensions: "33 x 25.5 x 3.25 cm",
      Weight: "1.61 kg",
      Channels: "8 Independent Wireless Channels",
    },
    downloads: [],
    status: "draft",
    source_url: "https://www.maxspect.com/en/innovate-series/1073-ethereal-infinites",
    last_scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_STOCKISTS: Stockist[] = [
  {
    id: "stk-1",
    name: "Charterhouse Aquatics",
    slug: "charterhouse-aquatics",
    address_line1: "Unit 2, The IO Centre, Lea Valley",
    city: "London",
    postcode: "E4 7QW",
    country: "United Kingdom",
    phone: "020 8524 8111",
    email: "sales@charterhouseaquatics.com",
    website: "https://charterhouseaquatics.com",
    latitude: 51.6184,
    longitude: -0.0245,
    is_verified_dealer: true,
    tier: "Gold",
    opening_hours: {
      "Mon - Fri": "09:30 - 17:30",
      Saturday: "10:00 - 17:00",
      Sunday: "Closed",
    },
  },
  {
    id: "stk-2",
    name: "AAC (Advanced Aquarium Consultancy)",
    slug: "aac-harlow",
    address_line1: "Unit 1, Harlow Mill Business Park",
    city: "Harlow",
    postcode: "CM20 2EQ",
    country: "United Kingdom",
    phone: "01279 432321",
    email: "info@aac-aquatics.co.uk",
    website: "https://aac-aquatics.co.uk",
    latitude: 51.7825,
    longitude: 0.1142,
    is_verified_dealer: true,
    tier: "Gold",
    opening_hours: {
      "Mon - Sat": "10:00 - 18:00",
      Sunday: "11:00 - 16:00",
    },
  },
  {
    id: "stk-3",
    name: "Maidenhead Aquatics Manchester",
    slug: "maidenhead-manchester",
    address_line1: "Barton Grange Garden Centre",
    city: "Preston / Manchester",
    postcode: "PR3 0BT",
    country: "United Kingdom",
    phone: "01995 642900",
    email: "manchester@fishkeeper.co.uk",
    website: "https://fishkeeper.co.uk",
    latitude: 53.8612,
    longitude: -2.7321,
    is_verified_dealer: true,
    tier: "Silver",
    opening_hours: {
      "Mon - Sat": "09:00 - 17:30",
      Sunday: "10:30 - 16:30",
    },
  },
  {
    id: "stk-4",
    name: "Finest Aquatics",
    slug: "finest-aquatics-widnes",
    address_line1: "Unit 16, Widnes Business Park",
    city: "Widnes",
    postcode: "WA8 0SW",
    country: "United Kingdom",
    phone: "0151 558 1110",
    email: "support@finestaquatics.co.uk",
    website: "https://finestaquatics.co.uk",
    latitude: 53.3642,
    longitude: -2.7214,
    is_verified_dealer: true,
    tier: "Gold",
  },
  {
    id: "stk-5",
    name: "Ocean Commotion Reefs",
    slug: "ocean-commotion-birmingham",
    address_line1: "142 High Street, Solihull",
    city: "Birmingham",
    postcode: "B91 3SX",
    country: "United Kingdom",
    phone: "0121 705 4488",
    email: "hello@oceancommotion.co.uk",
    website: "https://oceancommotion.co.uk",
    latitude: 52.4132,
    longitude: -1.7781,
    is_verified_dealer: true,
    tier: "Standard",
  },
];

export const DEFAULT_SPARES: SparePart[] = [
  {
    id: "sp-1",
    product_page_id: "prod-gyre-300-ce",
    series_slug: "innovate-series",
    sku: "MAX-GYR300-ROTOR",
    name: "Gyre 300 Cloud Edition Replacement Rotor Assembly",
    description: "Official factory replacement rotor & ceramic shaft for Gyre XF330 / XF350 pumps.",
    price_gbp: 29.99,
    image_url:
      "/media/images/Products/Innovate/gyre-300-ce/Gyre_300_CE_mainpic.png",
    in_stock: true,
    stock_count: 24,
    compatibility: ["Gyre XF330", "Gyre XF350", "Gyre 300 CE"],
  },
  {
    id: "sp-2",
    product_page_id: "prod-gyre-300-ce",
    series_slug: "innovate-series",
    sku: "MAX-GYR300-CAGE-L",
    name: "Gyre 300 Left Flow Directional Cage",
    description: "Replacement left-side directional cage with snap-fit mesh guard.",
    price_gbp: 14.5,
    image_url:
      "/media/images/Products/Innovate/gyre-300-ce/Gyre_300_CE_mainpic.png",
    in_stock: true,
    stock_count: 18,
    compatibility: ["Gyre XF330", "Gyre XF350"],
  },
  {
    id: "sp-3",
    product_page_id: "prod-aeraqua-duo",
    series_slug: "innovate-series",
    sku: "MAX-AD-IMPELLER",
    name: "Aeraqua Duo AD600 Needle Wheel Impeller",
    description: "Dual needle wheel impeller replacement unit for AD600 skimmer pump.",
    price_gbp: 42.0,
    image_url:
      "/media/images/Products/Jump/MJ-SKSeries/sk2000.jpg",
    in_stock: true,
    stock_count: 8,
    compatibility: ["Aeraqua Duo AD600"],
  },
  {
    id: "sp-4",
    product_page_id: "prod-mj-sk200",
    series_slug: "jump-series",
    sku: "MAX-MJ-PS-CUP",
    name: "Jump MJ-SK400 Skimmer Collection Cup & Lid",
    description: "Replacement clear acrylic collection cup with drain port elbow.",
    price_gbp: 22.95,
    image_url:
      "/media/images/Products/Jump/MJ-SKSeries/sk2000.jpg",
    in_stock: true,
    stock_count: 15,
    compatibility: ["MJ-SK400", "MJ-SK200"],
  },
  {
    id: "sp-5",
    sku: "MAX-PSU-24V4A",
    name: "Maxspect 24V 4A Universal Power Supply (UK Plug)",
    description: "Official 24V DC power transformer with UK 3-pin plug for Gyre & Jump pumps.",
    price_gbp: 38.5,
    image_url:
      "/media/images/Products/Jump/MJ-DC/DC.png",
    in_stock: true,
    stock_count: 30,
    compatibility: ["Gyre 300 CE", "Jump MJ-DC", "Jump MJ-GF"],
  },
];
