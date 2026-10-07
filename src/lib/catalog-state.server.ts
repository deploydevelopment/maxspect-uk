// Server-only in-memory catalog state (fallback when Supabase is unconfigured).
// Kept in a dedicated module so catalog.functions.ts stays a THIN server-fn
// wrapper with no module-scope mutable state — otherwise the tss-serverfn-split
// transform leaves handlers referencing bindings that live in another chunk,
// causing `ReferenceError: productsState is not defined` at runtime.

import { ProductPage, ProductCategory, Stockist, SparePart } from "./catalog.types";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_STOCKISTS,
  DEFAULT_SPARES,
} from "./catalog-data";

let products: ProductPage[] = [...DEFAULT_PRODUCTS];
let categories: ProductCategory[] = [...DEFAULT_CATEGORIES];
let stockists: Stockist[] = [...DEFAULT_STOCKISTS];
let spares: SparePart[] = [...DEFAULT_SPARES];

export function memGetProducts(): ProductPage[] {
  return products;
}
export function memGetCategories(): ProductCategory[] {
  return categories;
}
export function memGetStockists(): Stockist[] {
  return stockists;
}
export function memGetSpares(): SparePart[] {
  return spares;
}

export function memSetProducts(next: ProductPage[]): void {
  products = next;
}

/** Replace by slug, or prepend if missing. */
export function memUpsertProduct(product: ProductPage): void {
  const idx = products.findIndex((p) => p.slug === product.slug);
  if (idx >= 0) {
    const next = [...products];
    next[idx] = product;
    products = next;
  } else {
    products = [product, ...products];
  }
}

export function memRemoveProduct(slug: string): ProductPage | null {
  const existing = products.find((p) => p.slug === slug) || null;
  products = products.filter((p) => p.slug !== slug);
  return existing;
}
