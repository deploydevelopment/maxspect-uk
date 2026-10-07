// Server-only repository: reads/writes products, categories, stockists, spares.
// Uses Supabase when configured AND tables are present; otherwise falls back to
// a shared in-memory store. CRITICAL: reads and writes must use the SAME fallback
// so a synced product (with rewritten asset URLs) is actually returned on read.

import { getSupabase } from "./supabase.server";
import { ensureSchema } from "./supabase-schema.server";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_STOCKISTS,
  DEFAULT_SPARES,
} from "./catalog-data";
import { ProductCategory, ProductPage, Stockist, SparePart } from "./catalog.types";
import { localizeProductPage } from "./local-assets";

// Shared in-memory fallback store. Both reads and writes hit this when Supabase
// tables are missing, so synced (URL-rewritten) products are returned correctly.
export let memProducts: ProductPage[] = [...DEFAULT_PRODUCTS];
export let memCategories: ProductCategory[] = [...DEFAULT_CATEGORIES];
export let memStockists: Stockist[] = [...DEFAULT_STOCKISTS];
export let memSpares: SparePart[] = [...DEFAULT_SPARES];

export function setMemProducts(next: ProductPage[]) {
  memProducts = next;
}

let seeded = false;
let schemaOk: boolean | null = null;

/** Returns true only if Supabase tables are present and writable. */
async function checkSchema(): Promise<boolean> {
  if (schemaOk !== null) return schemaOk;
  const ok = await ensureSchema();
  schemaOk = ok;
  return ok;
}

async function seedIfEmpty(): Promise<void> {
  const sb = getSupabase();
  if (!sb || seeded) return;
  if (!(await checkSchema())) return; // tables missing — caller falls back to defaults
  const { data: existing, error } = await sb.from("products").select("id").limit(1);
  if (error) {
    seeded = true;
    return;
  }
  if (existing && existing.length > 0) {
    seeded = true;
    return;
  }
  await sb.from("product_categories").upsert(DEFAULT_CATEGORIES.map((c) => ({ ...c })));
  await sb.from("products").upsert(
    DEFAULT_PRODUCTS.map((p) => ({
      ...p,
      gallery_images: p.gallery_images,
      sections: p.sections || [],
      features: p.features,
      specs: p.specs,
      downloads: p.downloads,
    })),
  );
  await sb.from("stockists").upsert(DEFAULT_STOCKISTS.map((s) => ({ ...s })));
  await sb.from("spare_parts").upsert(DEFAULT_SPARES.map((s) => ({ ...s })));
  seeded = true;
}

// ---------- Categories ----------
export async function repoGetCategories(): Promise<ProductCategory[]> {
  const sb = getSupabase();
  if (!sb) return DEFAULT_CATEGORIES;
  if (!(await checkSchema())) return DEFAULT_CATEGORIES;
  await seedIfEmpty();
  const { data, error } = await sb
    .from("product_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return DEFAULT_CATEGORIES;
  return data as ProductCategory[];
}

// ---------- Products ----------
export async function repoGetPublishedProducts(): Promise<ProductPage[]> {
  const sb = getSupabase();
  if (!sb) return memProducts.filter((p) => p.status === "published").map(localizeProductPage);
  if (!(await checkSchema())) return memProducts.filter((p) => p.status === "published").map(localizeProductPage);
  await seedIfEmpty();
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error || !data) return memProducts.filter((p) => p.status === "published").map(localizeProductPage);
  return (data as ProductPage[]).map(localizeProductPage);
}

export async function repoGetAllProducts(): Promise<ProductPage[]> {
  const sb = getSupabase();
  if (!sb) return memProducts.map(localizeProductPage);
  if (!(await checkSchema())) return memProducts.map(localizeProductPage);
  await seedIfEmpty();
  const { data, error } = await sb
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return memProducts.map(localizeProductPage);
  return (data as ProductPage[]).map(localizeProductPage);
}

export async function repoGetProductBySlug(slug: string): Promise<ProductPage | null> {
  const sb = getSupabase();
  if (!sb) return localizeFound(memProducts.find((p) => p.slug === slug));
  if (!(await checkSchema())) return localizeFound(memProducts.find((p) => p.slug === slug));
  await seedIfEmpty();
  const { data, error } = await sb.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) {
    return localizeFound(memProducts.find((p) => p.slug === slug));
  }
  return localizeProductPage(data as ProductPage);
}

function localizeFound(product: ProductPage | undefined): ProductPage | null {
  return product ? localizeProductPage(product) : null;
}

export async function repoUpsertProduct(product: ProductPage): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) {
    // No client at all — mutate shared in-memory store so reads see it.
    memProducts = upsertMem(memProducts, product);
    return true;
  }
  if (!(await checkSchema())) {
    // Tables missing — mutate shared in-memory store so reads see it.
    memProducts = upsertMem(memProducts, product);
    return true;
  }
  await seedIfEmpty();
  const { error } = await sb.from("products").upsert({
    ...product,
    gallery_images: product.gallery_images,
    sections: product.sections || [],
    features: product.features,
    specs: product.specs,
    downloads: product.downloads,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`repoUpsertProduct: ${error.message}`);
  return true;
}

function upsertMem(arr: ProductPage[], product: ProductPage): ProductPage[] {
  const idx = arr.findIndex((p) => p.slug === product.slug);
  if (idx >= 0) {
    const next = [...arr];
    next[idx] = product;
    return next;
  }
  return [product, ...arr];
}

export async function repoUpdateProductStatus(
  id: string,
  status: "draft" | "published" | "archived",
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || !(await checkSchema())) {
    memProducts = memProducts.map((p) =>
      p.id === id ? { ...p, status, updated_at: new Date().toISOString() } : p,
    );
    return !sb; // true if we handled it in-memory; false if sb exists but schema missing (caller falls back)
  }
  const { error } = await sb
    .from("products")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`repoUpdateProductStatus: ${error.message}`);
  return true;
}

export async function repoDeleteProduct(slug: string): Promise<ProductPage | null> {
  const sb = getSupabase();
  if (!sb || !(await checkSchema())) {
    const existing = memProducts.find((p) => p.slug === slug) || null;
    memProducts = memProducts.filter((p) => p.slug !== slug);
    return existing;
  }
  const { data } = await sb.from("products").select("*").eq("slug", slug).maybeSingle();
  const { error } = await sb.from("products").delete().eq("slug", slug);
  if (error) throw new Error(`repoDeleteProduct: ${error.message}`);
  return (data as ProductPage) || null;
}

// ---------- Stockists ----------
export async function repoGetStockists(): Promise<Stockist[]> {
  const sb = getSupabase();
  if (!sb) return DEFAULT_STOCKISTS;
  if (!(await checkSchema())) return DEFAULT_STOCKISTS;
  await seedIfEmpty();
  const { data, error } = await sb.from("stockists").select("*");
  if (error || !data) return DEFAULT_STOCKISTS;
  return data as Stockist[];
}

// ---------- Spares ----------
export async function repoGetSpareParts(): Promise<SparePart[]> {
  const sb = getSupabase();
  if (!sb) return DEFAULT_SPARES;
  if (!(await checkSchema())) return DEFAULT_SPARES;
  await seedIfEmpty();
  const { data, error } = await sb.from("spare_parts").select("*");
  if (error || !data) return DEFAULT_SPARES;
  return data as SparePart[];
}

export function isUsingSupabase(): boolean {
  return getSupabase() !== null;
}
