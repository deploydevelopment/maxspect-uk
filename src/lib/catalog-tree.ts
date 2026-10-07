// Live maxspect.com catalogue: range → sub-range → product.
// Sub-ranges with their own page (MJ-L, Lagoon) keep that page's source_url.
// Cross-sells on Lagoon are not children. Gyre 300 Series is a product page,
// not a folder of separate model URLs.

import { CatalogProductNode, CatalogRange, CatalogSubRange } from "./catalog.types";

const p = (
  slug: string,
  title: string,
  source_url: string,
  hero_image?: string,
  summary?: string,
): CatalogProductNode => ({
  slug,
  title,
  status: "not-synced",
  source_url,
  hero_image,
  summary,
});

export const SOURCE_TREE: CatalogRange[] = [
  {
    slug: "innovate-series",
    name: "Innovate Series",
    description: "Flagship marine technology for demanding reef aquariums.",
    source_url: "https://www.maxspect.com/en/innovate-series",
    image_url:
      "/media/images/Products/Innovate/gyre-300-ce/Gyre_300_CE_mainpic.png",
    sub_ranges: [
      {
        slug: "gyre",
        name: "Gyre",
        description: "Cross-flow pumps, including the Cloud Edition and the Gyre 300 Series.",
        products: [
          p(
            "gyre-300-cloud-edition",
            "Gyre 300 Cloud Edition",
            "https://www.maxspect.com/en/innovate-series/617-gyre-300-ce",
            "/media/images/Products/Innovate/gyre-300-ce/Gyre_300_CE_mainpic.png",
            "Multi-directional water flow",
          ),
          p(
            "gyre-300-series",
            "Gyre 300 Series",
            "https://www.maxspect.com/en/innovate-series/598-gyre-300-series",
            "/media/images/Products/Innovate/gyre-300/Gyre_300.png",
            "Near-silent operation",
          ),
        ],
      },
      {
        slug: "aeraqua",
        name: "Aeraqua",
        products: [
          p(
            "aeraqua-duo-protein-skimmer",
            "Aeraqua Duo Protein Skimmer",
            "https://www.maxspect.com/en/innovate-series/596-aeraqua-duo-protein-skimmer",
            "/media/images/Products/Innovate/innovate-aeraqua-skimmer/360/3.jpg",
            "Dual intakes & dual needle wheels, closed loop recirculation",
          ),
        ],
      },
      {
        slug: "turbine-duo",
        name: "Turbine Duo",
        products: [
          p(
            "turbine-duo",
            "Turbine Duo",
            "https://www.maxspect.com/en/innovate-series/600-turbine-duo",
            "/media/images/Products/Innovate/turbine-duo/TD.png",
            "Compact size",
          ),
        ],
      },
      {
        slug: "ethereal",
        name: "Ethereal Infinite",
        description: "The fixture page, plus the technical and stand specification pages.",
        products: [
          p(
            "ethereal-infinite",
            "Ethereal Infinite",
            "https://www.maxspect.com/en/innovate-series/1073-ethereal-infinites",
            "/media/images/Products/Innovate/ethereal%20infinite/frontpage111.jpg",
            "More than meets the eye",
          ),
          p(
            "ethereal-infinite-e8-technical-specs",
            "Ethereal Infinite E8 Technical Specs",
            "https://www.maxspect.com/en/ethereal-infinite-e8-technical-specs",
          ),
          p(
            "ethereal-infinite-e8-stand-specs",
            "Ethereal Infinite E8 Stand Specs",
            "https://www.maxspect.com/en/ethereal-infinite-e8-stand-specs",
          ),
        ],
      },
      {
        slug: "rsx",
        name: "RSX",
        products: [
          p(
            "rsx",
            "RSX",
            "https://www.maxspect.com/en/innovate-series/599-rsx",
            "/media/images/Products/Innovate/rsx-marine/R5.png",
            "Streamline and low-profile",
          ),
        ],
      },
    ],
  },
  {
    slug: "jump-series",
    name: "Jump Series",
    description: "Accessible high-performance reef gear.",
    source_url: "https://www.maxspect.com/en/jump-series",
    image_url:
      "/media/images/Products/Jump/MJ-SKSeries/sk2000.jpg",
    sub_ranges: [
      {
        slug: "mj-l-led",
        name: "MJ-L LED Lights",
        description: "Jump LED lighting, with a page for each size.",
        source_url: "https://www.maxspect.com/en/jump-series/1208-mj-l-led-lights",
        image_url:
          "/media/images/Products/Jump/MJL.webp",
        products: [
          p("mj-l260-l290", "MJ-L260 & L290", "https://www.maxspect.com/en/l260-l290"),
          p("mj-l230", "MJ-L230(R)", "https://www.maxspect.com/en/mj-l230"),
        ],
      },
      {
        slug: "mj-sk",
        name: "MJ-SK Gen 2",
        products: [
          p(
            "mj-sk-gen-2",
            "MJ-SK Gen 2 Protein Skimmers",
            "https://www.maxspect.com/en/mj-sk200series",
          ),
        ],
      },
      {
        slug: "mj-gf",
        name: "MJ-GF",
        products: [
          p("mj-gf", "MJ-GF Pumps", "https://www.maxspect.com/en/jump-series/1114-gf308-316"),
        ],
      },
      {
        slug: "mj-dc",
        name: "MJ-DC",
        products: [
          p("mj-dc", "MJ-DC Pump", "https://www.maxspect.com/en/jump-series/602-mj-dc-pump"),
        ],
      },
    ],
  },
  {
    slug: "smart-aquarium",
    name: "Smart Aquarium",
    description: "All-in-one aquariums and the Lagoon system.",
    source_url: "https://www.maxspect.com/en/smart-aquarium",
    sub_ranges: [
      {
        slug: "dice-pico-2",
        name: "DICE Pico 2",
        image_url:
          "/media/images/Products/Innovate/dice-pico-2-aio/Pico_Cube_2G-Ann-20230919-500-500_4_25.png",
        products: [
          p(
            "dice-pico-2",
            "DICE Pico 2 AIO",
            "https://www.maxspect.com/en/smart-aquarium/1034-dice-pico-2-aio",
            "/media/images/Products/Innovate/dice-pico-2-aio/Pico_Cube_2G-Ann-20230919-500-500_4_25.png",
          ),
        ],
      },
      {
        slug: "lagoon-series",
        name: "Lagoon Series",
        description: "The Lagoon aquarium page, plus the two specification sheets.",
        source_url: "https://www.maxspect.com/en/lagoon-series",
        image_url: "/media/images/Products/SmartAquarium/Lagoon/lagoon150.jpg",
        products: [
          p(
            "lagoon-specs-060-090",
            "Lagoon Specifications LS-060 & LS-090",
            "https://www.maxspect.com/en/lagoon-series-specifications-ls-060-ls-090",
          ),
          p(
            "lagoon-specs-120-150",
            "Lagoon Specifications LS-120 & LS-150",
            "https://www.maxspect.com/en/lagoon-series-specifications-ls-120-ls-150",
          ),
        ],
      },
      {
        slug: "dice-nano",
        name: "DICE Nano",
        image_url: "/media/images/Products/SmartAquarium/dice40/dice40-pearl.webp",
        products: [
          p(
            "dice-nano",
            "DICE Nano Cube AIO",
            "https://www.maxspect.com/en/smart-aquarium/1093-dice-nano-cube-aio",
            "/media/images/Products/SmartAquarium/dice40/dice40-pearl.webp",
          ),
        ],
      },
      {
        slug: "reef-ready",
        name: "Reef Ready",
        image_url: "/media/images/Products/Innovate/reefready/reefreadyfront.jpg",
        products: [
          p(
            "reef-ready",
            "Reef Ready Series",
            "https://www.maxspect.com/en/reef-ready-lagoon-series",
            "/media/images/Products/Innovate/reefready/reefreadyfront.jpg",
          ),
        ],
      },
    ],
  },
  {
    slug: "nano-tech-bio-media",
    name: "Nano-Tech & Bio\u2011Media",
    description: "Biological filtration media and substrates.",
    source_url: "https://www.maxspect.com/en/nano-tech-bio-media",
    image_url:
      "/media/images/Products/Nano-tech/cubelets/biomedia3in1.jpg",
    sub_ranges: [
      {
        slug: "bio-sphere-bio-block-bio-cubelet",
        name: "Bio-Sphere, Bio-Block & Bio-Cubelet",
        products: [
          p(
            "bio-sphere-bio-block-bio-cubelet",
            "Bio-Sphere, Bio-Block & Bio-Cubelet",
            "https://www.maxspect.com/en/bio-sphere-bio-block-bio-cubelet",
            "/media/images/Products/Nano-tech/cubelets/biomedia3in1.jpg",
          ),
        ],
      },
      {
        slug: "nano-tech-phosphree",
        name: "Phosphree",
        products: [
          p(
            "nano-tech-phosphree",
            "Nano-Tech Phosphree",
            "https://www.maxspect.com/en/nano-tech-bio-media/616-nano-tech-phosphree",
            "/media/images/Products/Nano-tech/phosphree/p005.jpg",
          ),
        ],
      },
      {
        slug: "bio-sand",
        name: "Bio-Sand",
        products: [
          p(
            "bio-sand",
            "Bio-Sand",
            "https://www.maxspect.com/en/nano-tech-bio-media/1120-bio-sand",
            "/media/images/Products/Nano-tech/bio-sand/biosand6.webp",
          ),
        ],
      },
      {
        slug: "hexagon-frag-tiles",
        name: "Hexagon Frag Tiles",
        products: [
          p(
            "hexagon-frag-tiles",
            "Hexagon Frag Tiles",
            "https://www.maxspect.com/en/hexagon-frag-tiles",
            "/media/images/Products/Nano-tech/Hexagon/web/hexagon.jpg",
          ),
        ],
      },
      {
        slug: "nano-tech-clear-cube",
        name: "Clear Cube",
        products: [
          p(
            "nano-tech-clear-cube",
            "Nano-Tech Clear Cube",
            "https://www.maxspect.com/en/nano-tech-bio-media/615-nano-tech-clear-cube",
            "/media/images/Products/Nano-tech/clearcube/Clear_Cube.png",
          ),
        ],
      },
      {
        slug: "nano-tech-anaerobic-blocks",
        name: "Anaerobic Blocks",
        products: [
          p(
            "nano-tech-anaerobic-blocks",
            "Nano-Tech Anaerobic Blocks",
            "https://www.maxspect.com/en/nano-tech-bio-media/612-nano-tech-anaerobic-blocks",
            "/media/images/Products/Nano-tech/anaerobic/Anaerobics.png",
          ),
        ],
      },
      {
        slug: "biosphere-freshwater",
        name: "Biosphere Freshwater",
        products: [
          p(
            "biosphere-freshwater",
            "Biosphere Freshwater Series",
            "https://www.maxspect.com/en/nano-tech-bio-media/1038-biosphere-freshwater-series",
            "/media/images/Products/Nano-tech/freshwater/freshwater-thumbnail.jpg",
          ),
        ],
      },
      {
        slug: "nano-tech-bio-plug",
        name: "Bio-Plug",
        products: [
          p(
            "nano-tech-bio-plug",
            "Nano-Tech Bio-Plug",
            "https://www.maxspect.com/en/nano-tech-bio-media/613-nano-tech-bio-plug",
            "/media/images/Products/Nano-tech/bioplug/bioplugs.png",
          ),
        ],
      },
    ],
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Artwork and extras.",
    source_url: "https://www.maxspect.com/en/accessories",
    sub_ranges: [
      subProduct(
        "coral-oil-paintings",
        "Coral Oil Paintings on Canvas",
        "https://www.maxspect.com/en/accessories/1081-coral-oil-paintings-on-canvas",
      ),
    ],
  },
];

function subProduct(slug: string, title: string, source_url: string): CatalogSubRange {
  return {
    slug,
    name: title,
    products: [p(slug, title, source_url)],
  };
}

export interface CatalogLocation {
  range: CatalogRange;
  sub?: CatalogSubRange;
}

export function findCatalogLocation(slug: string): CatalogLocation | undefined {
  for (const range of SOURCE_TREE) {
    if (range.slug === slug) return { range };
    for (const sub of range.sub_ranges) {
      if (sub.slug === slug) return { range, sub };
    }
  }
  return undefined;
}

/** A sub-range is its own page when it has a source URL or more than one product. */
export function subRangeIsPage(sub: CatalogSubRange): boolean {
  return Boolean(sub.source_url) || sub.products.length > 1;
}

/** Range, and sub-range when that sub-range has its own page. */
export function findProductCrumb(slug: string): CatalogLocation | undefined {
  for (const range of SOURCE_TREE) {
    for (const sub of range.sub_ranges) {
      const product = sub.products.find((item) => item.slug === slug);
      if (!product) continue;
      const showSub = subRangeIsPage(sub) && sub.slug !== slug && sub.name !== product.title;
      return { range, sub: showSub ? sub : undefined };
    }
  }
  return undefined;
}

export function findSourceNode(slug: string): {
  node: CatalogProductNode | undefined;
  categorySlug: string | undefined;
} {
  for (const range of SOURCE_TREE) {
    for (const sub of range.sub_ranges) {
      const found = sub.products.find((product) => product.slug === slug);
      if (found) return { node: found, categorySlug: range.slug };
    }
  }
  return { node: undefined, categorySlug: undefined };
}

export interface ImportJob {
  slug: string;
  title: string;
  source_url: string;
  categorySlug: string;
  isRangePage: boolean;
}

/** Every source page to interpret, except the hand-built Cloud Edition. */
export function listImportJobs(): ImportJob[] {
  const jobs: ImportJob[] = [];
  for (const range of SOURCE_TREE) {
    for (const sub of range.sub_ranges) {
      if (sub.source_url && !sub.products.some((product) => product.slug === sub.slug)) {
        jobs.push({
          slug: sub.slug,
          title: sub.name,
          source_url: sub.source_url,
          categorySlug: range.slug,
          isRangePage: true,
        });
      }
      for (const product of sub.products) {
        if (!product.source_url || product.slug === "gyre-300-cloud-edition") continue;
        jobs.push({
          slug: product.slug,
          title: product.title,
          source_url: product.source_url,
          categorySlug: range.slug,
          isRangePage: false,
        });
      }
    }
  }
  return jobs;
}

export interface RegisterableProduct {
  slug: string;
  title: string;
  range: string;
}

/** Catalogue products a customer can register. Specification sheets are not products. */
export function listRegisterableProducts(): RegisterableProduct[] {
  const items: RegisterableProduct[] = [];
  for (const range of SOURCE_TREE) {
    for (const sub of range.sub_ranges) {
      const products = sub.products.filter((product) => !/spec/i.test(product.slug));
      if (products.length === 0) {
        items.push({ slug: sub.slug, title: sub.name, range: range.name });
        continue;
      }
      for (const product of products) {
        items.push({ slug: product.slug, title: product.title, range: range.name });
      }
    }
  }
  return items;
}

export function findRegisterableProduct(slug: string): RegisterableProduct | undefined {
  return listRegisterableProducts().find((product) => product.slug === slug);
}
