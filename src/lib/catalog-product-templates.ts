// Product section templates for synced maxspect.com products

import { ProductContentSection, ProductPage } from "./catalog.types";

export function getEtherealInfiniteSections(): ProductContentSection[] {
  const base = "/media/images/Products/Innovate/ethereal%20infinite";

  return [
    {
      id: "sec-ethereal-hero",
      type: "full_width_hero",
      heading: "Ethereal Infinite LED System",
      subheading:
        "More than meets the eye — 230W PAR Powerhouse with customizable mood illumination & redundant LED architecture.",
      image_url: `${base}/frontpage111.jpg`,
      overlay_images: [
        `${base}/Ethereal_logo.webp`,
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
    {
      id: "sec-color-world",
      type: "feature_block",
      heading: "Immerse Yourself in a World of Color",
      subheading:
        "Create a captivating atmosphere with customizable mood lights designed to complement your aquarium's aesthetic and enhance home ambiance. Offers 18 light patterns and syncs seamlessly with music beats.",
      image_url: `${base}/rgb_ethereal.webp`,
      secondary_images: [`${base}/rgb_ethereal2.webp`],
      items: [
        {
          title: "18 Light Patterns",
          description: "Kaleidoscope of luminescence around the fixture perimeter.",
        },
        {
          title: "Music Beat Sync",
          description: "Syncs seamlessly with music to turn beats into a visual rhythm.",
        },
      ],
    },
    {
      id: "sec-par-powerhouse",
      type: "feature_block",
      heading: "PAR Powerhouse: Illuminate Your Coral Reef with 230W* Optimal Lighting",
      subheading:
        "High-powered LED fixture delivering abundant PAR to drive growth and coloration in demanding SPS/LPS species. Available in 230W (E8-230) and 150W (E8-150).",
      image_url: `${base}/rgb_ethereal3.webp`,
      items: [
        {
          title: "E8-230 Model",
          description: "230W actual draw driving high-density reef penetration.",
        },
        {
          title: "E8-150 Model",
          description: "150W output ideal for mid-sized reef displays.",
        },
      ],
    },
    {
      id: "sec-redundant-chips",
      type: "diagram_callout",
      heading: "Superior Versatility & Longevity: Redundant LED Chips",
      subheading:
        "Equipped with 276 LED chips with a maximum theoretical output of 726W, operating at only 230W for seamless transitions between full blue and full white spectrums.",
      image_url: `${base}/leds.webp`,
      secondary_images: [
        `${base}/leds-closeup.webp`,
        `${base}/spectrum_white.webp`,
        `${base}/spectrum_blue.webp`,
        `${base}/leds_2.webp`,
      ],
    },
    {
      id: "sec-spectrum-matrix",
      type: "tech_specs_table",
      heading: "Channel Wavelength & LED Matrix Breakdown",
      subheading:
        "Detailed diode cluster configurations across 8 independently controlled channels.",
      specs_table: {
        "Channel A (UV)": { Wavelength: "390 - 400 nm", "LED Quantity": "12 diodes" },
        "Channel Violet": { Wavelength: "410 - 420 nm", "LED Quantity": "12 diodes" },
        "Channel Deep Blue": { Wavelength: "435 - 440 nm", "LED Quantity": "12 diodes" },
        "Channel B (Royal Blue)": { Wavelength: "450 - 455 nm", "LED Quantity": "96 diodes" },
        "Channel C (Light Blue)": { Wavelength: "460 - 470 nm", "LED Quantity": "72 diodes" },
        "Channel D (Cyan)": { Wavelength: "470 - 480 nm", "LED Quantity": "12 diodes" },
        "Channel E (Green)": { Wavelength: "520 - 525 nm", "LED Quantity": "12 diodes" },
        "Channel F (Cool White)": { Wavelength: "9000 - 11000 K", "LED Quantity": "24 diodes" },
        "Channel G (Warm White)": { Wavelength: "2800 - 3200 K", "LED Quantity": "12 diodes" },
        "Channel H (Red)": { Wavelength: "660 - 665 nm", "LED Quantity": "12 diodes" },
      },
    },
    {
      id: "sec-save-money",
      type: "feature_block",
      heading: "Save Energy, Save Money with Power-Saving Eco Mode",
      subheading:
        "Specially engineered energy-saving mode reduces power draw over an 8-month period while keeping low-light corals thriving and saving on electricity bills.",
      image_url: `${base}/save_money.webp`,
      secondary_images: [`${base}/normal_8month.webp`, `${base}/eco_8month.webp`],
    },
    {
      id: "sec-habitat-regions",
      type: "flow_examples",
      heading: "Experience Coral Habitat Regions from Around the Globe",
      subheading:
        "Select your desired regional preset (Great Barrier Reef, Sabah, Bali, Palawan, Okinawa) to automatically mimic natural light spectrum, dawn/dusk cycles, and seasonal shifts.",
      items: [
        {
          title: "Great Barrier Reef (Australia)",
          description: "Shallow reef intensity with punchy royal blue spectrum.",
          image_url: `${base}/australia0.webp`,
          secondary_images: [`${base}/coral1.webp`, `${base}/coral2.webp`],
        },
        {
          title: "Sabah (Malaysia)",
          description: "Gentle tropical lagoon sunrise to sunset schedule.",
          image_url: `${base}/sabah0.webp`,
          secondary_images: [`${base}/coral3.webp`],
        },
        {
          title: "Bali (Indonesia)",
          description: "Vibrant coral growth spectrum for colorful Acroporas.",
          image_url: `${base}/bali0.webp`,
          secondary_images: [`${base}/coral4.webp`],
        },
        {
          title: "Palawan (The Philippines)",
          description: "Crystal clear water penetration with high UV ratios.",
          image_url: `${base}/palawan0.webp`,
          secondary_images: [`${base}/Coral5.webp`],
        },
        {
          title: "Okinawa (Japan)",
          description: "Subtropical reef PAR curve for soft corals and LPS.",
          image_url: `${base}/okinawa0.webp`,
          secondary_images: [`${base}/Coral6.webp`],
        },
      ],
    },
    {
      id: "sec-slim-design",
      type: "feature_block",
      heading: "Lightweight, Durable & Ultra-Slim Aluminum Architecture",
      subheading:
        'Crafted from premium aluminum alloy, only 1¼" (3.25cm) thick. Efficiently dissipates heat generated by 276 LED chips without noise.',
      image_url: `${base}/Coins.webp`,
      items: [
        {
          title: "Ultra-Slim 3.25cm Profile",
          description: "Thinner than two stacked coins for a floating rimless look.",
        },
        {
          title: "Smart Safety Flip Switch",
          description:
            "Automatically turns off fixture when tilted upwards during tank maintenance.",
        },
      ],
    },
    {
      id: "sec-lightbox-grid",
      type: "water_flow_improvement",
      heading: "Smart Features & Advanced Control Accessories",
      subheading: "Complete control suite and custom mounting solutions.",
      items: [
        {
          title: "Multiple Full Spectrums",
          description: "Custom blue to white transition spectrums.",
          image_url: `${base}/lightbox-lights_2.webp`,
        },
        {
          title: "PAR Statistics",
          description: "Real-time optical energy distribution map.",
          image_url: `${base}/lightbox-lights_3.webp`,
        },
        {
          title: "Smart Cooling System",
          description: "Dual silent ball-bearing fans with temperature sensors.",
          image_url: `${base}/lightbox-lights_4.webp`,
        },
        {
          title: "Syna-G Cloud App Control",
          description: "Global wireless cloud scheduling & mesh networking.",
          image_url: `${base}/lightbox-lights_5.webp`,
        },
        {
          title: "Acclimation & Lunar Cycle",
          description: "Automated coral acclimation & real moon-phase schedules.",
          image_url: `${base}/lightbox-lights_6.webp`,
        },
      ],
    },
    {
      id: "sec-model-specs",
      type: "tech_specs_table",
      heading: "Ethereal Infinite Model Dimensions & Weight",
      subheading: "Factory physical dimensions and power requirements.",
      image_url: `${base}/Specifications1.webp`,
      specs_table: {
        "Power Draw": { "E8-230 Model": "230 W", "E8-150 Model": "150 W" },
        "Fixture Weight": {
          "E8-230 Model": "3.55 lbs (1,613g)",
          "E8-150 Model": "2.95 lbs (1,340g)",
        },
        "Dimensions (L x W x H)": {
          "E8-230 Model": '13" x 10" x 1¼" (33 x 25.5 x 3.25cm)',
          "E8-150 Model": '10" x 10" x 1¼" (25.5 x 25.5 x 3.25cm)',
        },
      },
    },
  ];
}
