export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
}

export interface ProductSeries {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
}

export type ProductSectionType =
  | "hero_banner"
  | "full_width_hero"
  | "feature_block"
  | "diagram_callout"
  | "flow_patterns"
  | "media_gallery"
  | "video_embed"
  | "water_flow_improvement"
  | "flow_examples"
  | "tech_specs_table";

/**
 * Per-section sync lifecycle:
 *   not-synced → pending (pulled) → approved (live) / rejected
 * Sections are pulled individually from maxspect.com and approved one at a time.
 */
export type SectionSyncStatus = "not-synced" | "pending" | "approved" | "rejected";

export interface ProductContentSection {
  id: string;
  type: ProductSectionType;
  heading?: string;
  subheading?: string;
  body?: string;
  image_url?: string;
  secondary_images?: string[];
  overlay_images?: string[]; // smaller images overlaid on the hero (bottom-right)
  video_url?: string;
  video_title?: string;
  aspect_ratio?: string;
  items?: { title: string; description?: string; image_url?: string; icon?: string }[];
  specs_table?: Record<string, Record<string, string>>; // e.g. { Model: { Power: "52W" } }
  /**
   * How a feature section should lay out on the UK page.
   * split = image beside text (one row per item). grid = equal columns of cards.
   */
  layout?: "split" | "grid" | "poster" | "aside" | "banner";
  /** Headline alignment for a full-bleed poster section. */
  align?: "start" | "end";
  columns?: number;
  /** Manufacturer band used a black background. */
  surface?: "dark";
  // --- per-section sync pipeline ---
  sync_status?: SectionSyncStatus;
  source_order?: number; // position on the maxspect.com source page (0 = top)
  source_signature?: string; // stable hash to detect source changes
}

/**
 * Lightweight scan result: one entry per section detected on the source page,
 * in top-to-bottom document order. No assets are downloaded at scan time.
 * The admin pulls sections individually from this list.
 */
export interface ScannedSection {
  source_order: number;
  type: ProductSectionType;
  heading?: string;
  subheading?: string;
  source_signature: string;
  preview_url?: string; // first image or video URL (original maxspect.com) for thumbnail
  has_video: boolean;
  has_image: boolean;
  item_count: number;
  /** Full section payload (original URLs) — passed back to pullProductSection. */
  section: ProductContentSection;
}

export interface ProductPage {
  id: string;
  series_id?: string;
  category_id: string;
  slug: string;
  title: string;
  subtitle?: string;
  hero_image?: string | null;
  hero_badge?: string;
  gallery_images: string[];
  sections?: ProductContentSection[];
  features: { title: string; description: string; icon?: string }[];
  specs: Record<string, string | number>;
  downloads: { name: string; url: string; type: string }[];
  status: "draft" | "published" | "archived";
  source_url?: string;
  last_scraped_at?: string;
  created_at: string;
  updated_at: string;
}

// ---- Catalog tree (ranges → sub-ranges → products) ----

export type SyncStatus = "published" | "draft" | "archived" | "not-synced";

export interface CatalogProductNode {
  slug: string;
  title: string;
  status: SyncStatus;
  source_url?: string;
  hero_image?: string;
  /** One-line caption used on the parent range landing, as on maxspect.com. */
  summary?: string;
  last_synced_at?: string;
}

export interface CatalogSubRange {
  slug: string;
  name: string;
  description?: string;
  source_url?: string;
  image_url?: string;
  products: CatalogProductNode[];
}

export interface CatalogRange {
  slug: string;
  name: string;
  description?: string;
  image_url?: string;
  source_url?: string;
  sub_ranges: CatalogSubRange[];
}

export interface TreeSummary {
  total: number;
  published: number;
  drafts: number;
  notSynced: number;
  archived: number;
}

export interface Stockist {
  id: string;
  name: string;
  slug: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postcode: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  is_verified_dealer: boolean;
  tier: "Gold" | "Silver" | "Standard";
  opening_hours?: Record<string, string>;
}

export interface SparePart {
  id: string;
  product_page_id?: string;
  series_slug?: string;
  sku: string;
  name: string;
  description: string;
  price_gbp: number;
  image_url: string;
  in_stock: boolean;
  stock_count: number;
  compatibility: string[];
}
