// Live Maxspect catalogue from Supply Engine. Cached in memory for a few
// minutes: the feed changes when products are edited, not on a schedule.
// Range, subrange, and product endpoints are preferred. If they are not
// deployed, the channel list is filtered to the Spares range.

import type { LiveStockist, SparesShop, StockistFeed, SupplyGroup, SupplySpare } from "./supply-engine.types";

const API = "https://app.supplyengine.co.uk/api";
const USERNAME = "bcuk";
const CHANNEL = "maxspect.co.uk";
const SPARES_RANGE_ID = "11";
const STOCKIST_GROUP = "4";
const API_KEY = "d7ce6b19e8967082f391e370fd04af1d566b50cfe6efc009";
const CACHE_MS = 5 * 60 * 1000;

type CacheEntry<T> = { at: number; value: T };

const cache = new Map<string, CacheEntry<unknown>>();

type ShortProduct = {
  id: number | string;
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  price?: number | null;
  price_was?: number | null;
  stock_level?: number | null;
  brand?: string;
  ranges?: Array<string | { id?: number | string; name?: string; slug?: string }>;
  subranges?: Array<string | { id?: number | string; name?: string; slug?: string }>;
  images?: string[];
  thumbnails?: string[];
};

function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function asGroups(value: ShortProduct["ranges"]): SupplyGroup[] {
  if (!value) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (!name) return [];
      return [{ id: name, name, slug: name }];
    }
    const name = entry.name?.trim() || "";
    if (!name) return [];
    return [{ id: String(entry.id ?? name), name, slug: entry.slug || name }];
  });
}

function toSpare(product: ShortProduct, groupIds: string[]): SupplySpare | null {
  const name = product.name?.trim();
  if (!name) return null;
  const images = (product.images ?? []).filter((url): url is string => Boolean(url));
  const thumbs = (product.thumbnails ?? []).filter((url): url is string => Boolean(url));
  const image = images[0] || thumbs[0] || "/holding.jpg";
  const thumbnail = thumbs[0] || images[0] || "/holding.jpg";
  const price = typeof product.price === "number" ? product.price : Number(product.price);
  return {
    id: String(product.id),
    name,
    slug: product.slug || "",
    sku: product.sku?.trim() || "",
    description: htmlToText(product.description || ""),
    price: Number.isFinite(price) ? price : 0,
    priceWas: typeof product.price_was === "number" ? product.price_was : null,
    image,
    thumbnail,
    images: images.length > 0 ? images : [image],
    thumbnails: thumbs.length > 0 ? thumbs : [thumbnail],
    stockLevel: typeof product.stock_level === "number" ? product.stock_level : 0,
    brand: product.brand?.trim() || "",
    groupIds,
  };
}

async function readJson(file: string, params: Record<string, string>): Promise<unknown | null> {
  const url = new URL(`${API}/${file}`);
  url.searchParams.set("username", USERNAME);
  url.searchParams.set("channel", CHANNEL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    redirect: "follow",
  });
  if (!response.ok) return null;
  const text = await response.text();
  try {
    const data = JSON.parse(text) as { error?: string };
    if (data && typeof data === "object" && data.error) return null;
    return data;
  } catch {
    return null;
  }
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function loadChannelProducts() {
  return cached("products", async () => {
    const data = (await readJson("products.php", {})) as { products?: ShortProduct[] } | null;
    return data?.products ?? null;
  });
}

async function loadRangeGroups() {
  return cached("spares-range", async () => {
    const data = (await readJson("range.php", { id: SPARES_RANGE_ID })) as {
      subranges?: Array<{ id?: number | string; name?: string; slug?: string }>;
    } | null;
    const groups = (data?.subranges ?? [])
      .map((subrange) => {
        const name = subrange.name?.trim() || "";
        if (!name || subrange.id == null) return null;
        return { id: String(subrange.id), name, slug: subrange.slug || "" };
      })
      .filter((group): group is SupplyGroup => group !== null);
    return groups.length > 0 ? groups : null;
  });
}

async function loadSubrangeProducts(groupId: string) {
  return cached(`subrange:${groupId}`, async () => {
    const data = (await readJson("subrange.php", { id: groupId })) as {
      products?: ShortProduct[];
    } | null;
    return data?.products ?? null;
  });
}

function sparesFromChannel(products: ShortProduct[]) {
  return products.flatMap((product) => {
    const groups = asGroups(product.ranges);
    if (!groups.some((group) => group.name === "Spares")) return [];
    const spare = toSpare(product, []);
    return spare ? [spare] : [];
  });
}

const SHOP = "https://maxspect.co.uk/shop/";

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "text/html" },
    redirect: "follow",
  });
  if (!response.ok) return null;
  return response.text();
}

function productIds(html: string) {
  return [...new Set([...html.matchAll(/\/product\/[^"'?\s]+\/(\d+)\//g)].map((match) => match[1]))];
}

async function loadShopRanges() {
  return cached("shop-ranges", async () => {
    const index = await fetchText(SHOP);
    if (!index) return null;
    const groups: SupplyGroup[] = [];
    const pattern = /<option value="\/shop\/([a-z0-9-]+)\/"\s*>SORT BY:\s*([^<]+)<\/option>/gi;
    for (const match of index.matchAll(pattern)) {
      const slug = match[1];
      const name = match[2].trim();
      if (!slug || !name) continue;
      groups.push({ id: slug, name, slug });
    }
    if (groups.length === 0) return null;

    const pages = await Promise.all(
      groups.map(async (group) => {
        const html = await fetchText(`${SHOP}${group.slug}/`);
        return { id: group.id, ids: html ? productIds(html) : [] };
      }),
    );
    const membership = new Map<string, string[]>();
    for (const page of pages) {
      for (const id of page.ids) {
        const current = membership.get(id);
        if (current) current.push(page.id);
        else membership.set(id, [page.id]);
      }
    }
    return { groups, membership };
  });
}

async function loadFromApi(groups: SupplyGroup[]): Promise<SparesShop | null> {
  const pages = await Promise.all(
    groups.map(async (group) => ({
      id: group.id,
      products: await loadSubrangeProducts(group.id),
    })),
  );
  if (pages.some((page) => !page.products)) return null;

  const byId = new Map<string, SupplySpare>();
  for (const page of pages) {
    for (const product of page.products ?? []) {
      const spare = toSpare(product, [page.id]);
      if (!spare) continue;
      const existing = byId.get(spare.id);
      if (existing) existing.groupIds.push(page.id);
      else byId.set(spare.id, spare);
    }
  }

  return {
    groups,
    products: [...byId.values()].sort((a, b) => a.name.localeCompare(b.name)),
    error: null,
  };
}

export async function loadSparesShop(): Promise<SparesShop> {
  const empty: SparesShop = {
    groups: [],
    products: [],
    error: "The parts catalogue could not be loaded.",
  };
  try {
    const apiGroups = await loadRangeGroups();
    if (apiGroups) {
      const api = await loadFromApi(apiGroups);
      if (api) return api;
    }

    const products = await loadChannelProducts();
    if (!products) return empty;

    const shop = await loadShopRanges();
    const spares = sparesFromChannel(products).map((spare) => ({
      ...spare,
      groupIds: [...(shop?.membership.get(spare.id) ?? [])],
    }));

    return {
      groups: shop?.groups ?? [],
      products: spares.sort((a, b) => a.name.localeCompare(b.name)),
      error: null,
    };
  } catch {
    return empty;
  }
}

type CustomerRecord = {
  id?: number | string;
  organisation?: string;
  name?: string;
  surname?: string;
  telephone?: string;
  mobile?: string;
  website?: string;
  house?: string;
  street?: string;
  town?: string;
  county?: string;
  postcode?: string;
  opening_times?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function usablePhone(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text.replace(/\D/g, "").length >= 10) return text;
  }
  return "";
}

function clockLabel(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hour24 = Number(match[1]);
  const minutes = match[2];
  const suffix = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 || 12;
  return minutes === "00" ? `${hour12}${suffix}` : `${hour12}:${minutes}${suffix}`;
}

function formatOpeningTimes(value: string) {
  const slots = value.split(",").map((slot) => slot.trim()).filter(Boolean);
  if (slots.length !== WEEKDAYS.length) return [];
  return slots.flatMap((slot, index) => {
    const [open, close] = slot.split("/").map((part) => part.trim());
    const closed = !open || !close || open.toLowerCase() === "closed" || close.toLowerCase() === "closed";
    if (closed) return [];
    return [{ day: WEEKDAYS[index], hours: `${clockLabel(open)}–${clockLabel(close)}` }];
  });
}

function websiteHref(value: string) {
  if (!value || value === "http://" || value === "https://") return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function toStockist(customer: CustomerRecord): LiveStockist | null {
  const organisation = clean(customer.organisation);
  const person = [clean(customer.name), clean(customer.surname)].filter(Boolean).join(" ");
  const name = organisation || person;
  if (!name || customer.id == null) return null;
  return {
    id: String(customer.id),
    name,
    address: [clean(customer.house), clean(customer.street)].filter(Boolean).join(", "),
    town: clean(customer.town),
    county: clean(customer.county),
    postcode: clean(customer.postcode),
    phone: usablePhone(customer.telephone, customer.mobile),
    website: websiteHref(clean(customer.website)),
    openingTimes: formatOpeningTimes(clean(customer.opening_times)),
  };
}

export function mapsEmbedKey() {
  return process.env.GOOGLE_MAPS_API_KEY || "";
}

export async function loadSupplyStockists(): Promise<StockistFeed> {
  const hit = cache.get("stockists:v3") as CacheEntry<LiveStockist[]> | undefined;
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return { stockists: hit.value, error: null };
  }

  const unavailable: StockistFeed = {
    stockists: [],
    error: "The stockist list could not be loaded.",
  };

  try {
    const url = new URL(`${API}/customers.php`);
    url.searchParams.set("username", USERNAME);
    url.searchParams.set("groups", STOCKIST_GROUP);
    const response = await fetch(url, {
      headers: { Accept: "application/json", "X-Api-Key": API_KEY },
      redirect: "follow",
    });
    if (!response.ok) return unavailable;
    const data = (await response.json()) as { customers?: CustomerRecord[]; error?: string };
    if (data.error) return unavailable;
    const stockists = (data.customers ?? [])
      .map(toStockist)
      .filter((stockist): stockist is LiveStockist => stockist !== null)
      .sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
    cache.set("stockists:v3", { at: Date.now(), value: stockists });
    return { stockists, error: null };
  } catch {
    return unavailable;
  }
}

export async function loadSupplyProduct(id: string): Promise<SupplySpare | null> {
  const full = (await readJson("product.php", { id })) as { product?: ShortProduct } | null;
  if (full?.product) {
    const groups = [...asGroups(full.product.ranges), ...asGroups(full.product.subranges)];
    return toSpare(
      full.product,
      groups.map((group) => group.id),
    );
  }

  const products = await loadChannelProducts();
  const match = products?.find((product) => String(product.id) === id);
  if (!match) return null;
  const groups = asGroups(match.ranges);
  return toSpare(
    match,
    groups.map((group) => group.id),
  );
}
