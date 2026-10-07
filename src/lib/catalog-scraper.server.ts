// Dynamic maxspect.com HTML scraper powered by cheerio DOM parser.
// Walks the real HTML document tree TOP-TO-BOTTOM in document order.
// Captures every section (headings, text, images, videos, lists, tables)
// without regex parsing so pages mirror source layout accurately.

import * as cheerio from "cheerio";
import { ProductContentSection, ProductPage } from "./catalog.types";

const MAXSPECT_BASE = "https://www.maxspect.com";

export function absoluteUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${MAXSPECT_BASE}${url}`;
  return `${MAXSPECT_BASE}/${url}`;
}

/**
 * Normalise an image URL to a comparable signature.
 */
export function imageSignature(url: string): string {
  if (!url) return "";
  const srcParam = /[?&]src=([^&]+)/i.exec(url);
  let base = srcParam ? decodeURIComponent(srcParam[1]) : url;
  base = base.split("?")[0].split("#")[0];
  const parts = base.split("/");
  return parts[parts.length - 1].toLowerCase();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&middot;/gi, "·")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Exclude site chrome, spacers, and nav thumbnails. */
function isJunkImage(src: string): boolean {
  if (!src) return true;
  if (
    /spacer|qrwechat|avatar|flag|button|nav|cart|menu|footer|header|social|arrow|search|logomaxspect|maxspect-logo/i.test(
      src,
    )
  ) {
    return true;
  }
  // Yootheme menu thumbnails
  if (/thumbnail=(60|131|183|209|150),(60|70|80|150)/i.test(src)) {
    return true;
  }
  return false;
}

export async function scrapeMaxspectProductPage(
  sourceUrl: string,
  title: string,
  slug: string,
): Promise<Partial<ProductPage>> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[Scraper] Failed to fetch ${sourceUrl}: HTTP ${res.status}`);
      return {};
    }

    const html = await res.text();
    return parseMaxspectHtmlCheerio(html, sourceUrl, title, slug);
  } catch (err: any) {
    console.error(`[Scraper] Error scraping ${sourceUrl}:`, err?.message || err);
    return {};
  }
}

type ColumnItem = { title: string; description?: string; image_url?: string };

interface DraftSection {
  heading?: string;
  subheading?: string;
  image_url?: string;
  video_url?: string;
  overlay_images?: string[];
  layout?: "split" | "grid" | "poster" | "aside" | "banner";
  align?: "start" | "end";
  columns?: number;
  items: ColumnItem[];
  specs_table?: Record<string, Record<string, string>>;
  type: ProductContentSection["type"];
}

const BP_RANK: Record<string, number> = { "": 0, s: 1, m: 2, l: 3, xl: 4 };

function isLayoutGrid($el: cheerio.Cheerio<cheerio.Element>): boolean {
  const cls = $el.attr("class") || "";
  return $el.is("[uk-grid]") || /(^|\s)uk-grid(\s|$)/.test(cls);
}

function columnCount(className: string, childCount: number): number {
  let bestRank = -1;
  let count = childCount;
  for (const match of className.matchAll(/uk-child-width-1-(\d+)(?:@(\w+))?/g)) {
    const rank = BP_RANK[match[2] || ""] ?? 0;
    if (rank >= bestRank) {
      bestRank = rank;
      count = Number(match[1]);
    }
  }
  return Math.max(1, count || childCount || 1);
}

function blackBandIds($: cheerio.CheerioAPI): Set<string> {
  const ids = new Set<string>();
  $("style").each((_, node) => {
    const css = $(node).text();
    for (const match of css.matchAll(/#page\\+#(\d+)\s*\{([^}]+)\}/g)) {
      const body = match[2];
      if (/background-clip/.test(body)) continue;
      if (
        /background(?:-color)?\s*:\s*(?:#000(?:000)?|rgba\(\s*0\s*,\s*0\s*,\s*0(?:\s*,\s*1(?:\.0+)?)?\s*\))/i.test(
          body,
        )
      ) {
        ids.add(`page#${match[1]}`);
      }
    }
  });
  return ids;
}

function bandIsDark(
  $: cheerio.CheerioAPI,
  el: cheerio.Cheerio<cheerio.Element>,
  darkIds: Set<string>,
): boolean {
  const section = el.closest(".uk-section");
  const target = section.length ? section : el;
  const style = target.attr("style") || "";
  if (
    /background(?:-color)?\s*:\s*(?:#000(?:000)?|rgba\(\s*0\s*,\s*0\s*,\s*0(?:\s*,\s*1(?:\.0+)?)?\s*\))/i.test(
      style,
    )
  ) {
    return true;
  }
  const id = target.attr("id") || "";
  return darkIds.has(id);
}

function cellText($: cheerio.CheerioAPI, el: cheerio.Cheerio<cheerio.Element>): string {
  const clone = el.clone();
  clone.find("br").replaceWith(" ");
  return decodeEntities(clone.text());
}

function mediaUrl($: cheerio.CheerioAPI, el: cheerio.Cheerio<cheerio.Element>): {
  image?: string;
  video?: string;
} {
  const img = el.find("img").toArray().find((node) => {
    if (isHiddenBranch($, node)) return false;
    const raw = $(node).attr("src") || $(node).attr("data-src") || "";
    return raw && !isTinyAsset(raw, $(node).attr("width")) && !/spacer/i.test(raw);
  });
  const rawSrc = img ? $(img).attr("src") || $(img).attr("data-src") : undefined;
  const imgSrc = originalAsset(rawSrc);
  const linkHref = absoluteUrl(el.find("a[href]").first().attr("href"));
  const imageCandidate =
    imgSrc && !isJunkImage(imgSrc)
      ? imgSrc
      : linkHref && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(linkHref) && !isJunkImage(linkHref)
        ? originalAsset(linkHref)
        : undefined;

  let video: string | undefined;
  el.find("video, video source, source, iframe").each((_, node) => {
    if (video) return;
    const abs = absoluteUrl($(node).attr("src"));
    if (abs && (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(abs) || /youtube\.com|youtu\.be/i.test(abs))) {
      video = abs.replace(/ /g, "%20");
    }
  });
  return { image: imageCandidate, video };
}

function captionFrom($: cheerio.CheerioAPI, el: cheerio.Cheerio<cheerio.Element>): {
  title?: string;
  description?: string;
} {
  const captionAttr = el.find("[data-caption]").first().attr("data-caption");
  const $cap = captionAttr ? cheerio.load(`<div>${captionAttr}</div>`) : null;
  const title = $cap
    ? decodeEntities($cap("h1,h2,h3,h4,.el-title").first().text())
    : cellText($, el.find("h1,h2,h3,h4,.el-title").first());
  let description = "";
  if ($cap) {
    description = decodeEntities($cap("p, .el-content").first().text());
    if (!description) {
      description = decodeEntities($cap("div").text());
      if (title && description.startsWith(title)) description = description.slice(title.length).trim();
    }
  } else {
    const content = el.find(".el-content, p").first();
    description = content.length ? cellText($, content) : "";
    if (!description) {
      const full = cellText($, el);
      if (title && full.length > title.length) description = full.replace(title, "").trim();
    }
  }
  if (description === title) description = "";
  return {
    title: title && title.length > 1 ? title : undefined,
    description: description && description.length > 1 ? description : undefined,
  };
}

interface ParsedGrid {
  mode: "split-row" | "cards" | "text" | "specs" | "diagram" | "hero" | "poster" | "aside" | "banner";
  align?: "start" | "end";
  heading?: string;
  subheading?: string;
  image_url?: string;
  video_url?: string;
  overlay_images?: string[];
  columns: number;
  items: ColumnItem[];
  specs_table?: Record<string, Record<string, string>>;
  note?: string;
}

function parseTable(
  $: cheerio.CheerioAPI,
  table: cheerio.Cheerio<cheerio.Element>,
): { specs: Record<string, Record<string, string>>; flat: Record<string, string> } | null {
  type LiveSpan = { col: number; value: string; rowsLeft: number };
  const spans: LiveSpan[] = [];
  const matrix: string[][] = [];
  table.find("tr").each((_, tr) => {
    const row: string[] = [];
    let col = 0;
    const cells = $(tr).children("th, td").toArray();
    let index = 0;
    while (index < cells.length || spans.some((span) => span.col >= col && span.rowsLeft > 0)) {
      const span = spans.find((item) => item.col === col && item.rowsLeft > 0);
      if (span) {
        row[col] = span.value;
        span.rowsLeft -= 1;
        col += 1;
        continue;
      }
      if (index >= cells.length) break;
      const cell = $(cells[index]);
      const text = cellText($, cell);
      const rowspan = Math.max(1, Number(cell.attr("rowspan") || 1));
      const colspan = Math.max(1, Number(cell.attr("colspan") || 1));
      for (let offset = 0; offset < colspan; offset++) {
        row[col] = text;
        if (rowspan > 1) spans.push({ col, value: text, rowsLeft: rowspan - 1 });
        col += 1;
      }
      index += 1;
    }
    if (row.some(Boolean)) matrix.push(row);
  });
  const headers = matrix[0] || [];
  if (headers.length < 2) return null;
  const keyIndex = headers.findIndex((header) => /^colou?r$/i.test(header));
  const specs: Record<string, Record<string, string>> = {};
  const flat: Record<string, string> = {};
  for (const row of matrix.slice(1)) {
    const rowKey = (keyIndex >= 0 ? row[keyIndex] : row[0]) || "";
    if (!rowKey) continue;
    specs[rowKey] = {};
    const parts: string[] = [];
    for (let i = 0; i < headers.length; i++) {
      if (i === (keyIndex >= 0 ? keyIndex : 0)) continue;
      const key = headers[i] || `Col ${i}`;
      const value = row[i] || "";
      if (!value) continue;
      specs[rowKey][key] = value;
      parts.push(`${key}: ${value}`);
    }
    flat[rowKey] = parts.join(" · ");
  }
  return Object.keys(specs).length ? { specs, flat } : null;
}

function parseLeafGrid($: cheerio.CheerioAPI, grid: cheerio.Cheerio<cheerio.Element>): ParsedGrid | null {
  const tables = grid.find("table");
  if (tables.length) {
    const specImages: string[] = [];
    grid.find("img").each((_, img) => {
      const raw = $(img).attr("src") || $(img).attr("data-src");
      if (!raw || isTinyAsset(raw, $(img).attr("width")) || isJunkImage(raw)) return;
      const abs = originalAsset(raw);
      if (abs && !specImages.includes(abs)) specImages.push(abs);
    });
    // Several designed spec cards, one graphic per table. Keep the graphics.
    if (specImages.length >= tables.length && tables.length > 1) {
      return {
        mode: "cards",
        columns: columnCount(grid.attr("class") || "", specImages.length),
        items: specImages.map((url) => ({ title: "", image_url: url })),
      };
    }
    let best: ReturnType<typeof parseTable> = null;
    let bestCols = 0;
    tables.each((_, table) => {
      const cols = $(table).find("tr").first().find("th, td").length;
      if (cols > bestCols) {
        bestCols = cols;
        best = parseTable($, $(table));
      }
    });
    const note = grid
      .find("p, .el-content")
      .toArray()
      .map((node) => cellText($, $(node)))
      .find((text) => text.startsWith("*") || /perpendicular/i.test(text));
    if (best) {
      const headerLine = Object.keys(Object.values(best.specs)[0] || {}).join(" ");
      return {
        mode: "specs",
        columns: 1,
        items: [],
        specs_table: best.specs,
        note,
        heading: /wavelength/i.test(headerLine) ? "LED Channels" : "Specifications",
        image_url: specImages[0],
      };
    }
  }

  const children = grid.children().toArray();
  const columns = columnCount(grid.attr("class") || "", children.length);
  const cols = children.map((child) => {
    const el = $(child);
    const media = mediaUrl($, el);
    const cap = captionFrom($, el);
    return { ...cap, image: media.image, video: media.video, text: cellText($, el) };
  });

  const mediaCols = cols.filter((col) => col.image || col.video);
  const textCols = cols.filter((col) => !col.image && !col.video && (col.title || col.description || col.text));
  const videoOnly = cols.filter((col) => col.video && !col.image);

  if (cols.length === 2 && mediaCols.length === 1 && textCols.length === 1) {
    const media = mediaCols[0];
    const text = textCols[0];
    if (media.video && !media.image) {
      return {
        mode: "split-row",
        columns: 2,
        heading: text.title,
        subheading: text.description || text.text,
        video_url: media.video,
        items: [],
      };
    }
    const narrow = children.some((child) => /uk-width-1-[45](?:@\w+)?/.test($(child).attr("class") || ""));
    return {
      mode: "split-row",
      columns: narrow ? 4 : 2,
      heading: narrow ? text.title : undefined,
      subheading: narrow ? text.description || text.text : undefined,
      items: [
        {
          title: narrow ? "" : text.title || "",
          description: narrow ? undefined : text.description || (text.title ? undefined : text.text),
          image_url: media.image,
        },
      ],
    };
  }

  if (videoOnly.length > 0 && mediaCols.every((col) => !col.image)) {
    return {
      mode: "split-row",
      columns: 1,
      heading: textCols[0]?.title,
      subheading: textCols[0]?.description || textCols[0]?.text,
      video_url: videoOnly[0].video,
      items: [],
    };
  }

  const items: ColumnItem[] = [];
  for (const col of cols) {
    if (!col.image && !col.title && !col.description) continue;
    items.push({
      title: col.title || "",
      description: col.description,
      image_url: col.image,
    });
  }

  const illustrated = items.filter((item) => item.image_url);
  if (illustrated.length === 0) {
    const headings = grid
      .find("h1, h2, h3")
      .toArray()
      .map((node) => cellText($, $(node)))
      .filter(Boolean);
    const lead = cellText($, grid.find(".uk-text-lead").first());
    const blurb =
      items.find((item) => item.description)?.description ||
      textCols[0]?.description ||
      (lead.length > 40 && lead.length < 700 ? lead : undefined);
    if (!headings[0] && !blurb) return null;
    return {
      mode: "text",
      columns: 1,
      heading: headings[0],
      subheading: headings[1] || blurb,
      items: [],
    };
  }

  const titledCount = illustrated.filter((item) => item.title).length;
  const cardColumns = columns === 1 && titledCount >= 4 ? 3 : columns;
  return { mode: "cards", columns: cardColumns, items: illustrated };
}

/**
 * Some manufacturer rows are one full-width column with a sequence of
 * photos, headings, and a nested card row. A normal grid parse keeps only
 * the first image. Replay that sequence as separate sections instead.
 */
function stackedColumnGrids(
  $: cheerio.CheerioAPI,
  grid: cheerio.Cheerio<cheerio.Element>,
): ParsedGrid[] | null {
  if (grid.find("video, iframe").length) return null;
  const only = grid.children().length === 1 ? grid.children().first() : null;
  const scope = only && /\buk-width-1-1\b/.test(only.attr("class") || "") ? only : null;
  if (!scope) return null;

  const loose = scope.children().toArray().filter((el) => {
    const $el = $(el);
    if (/\buk-hidden\b/.test($el.attr("class") || "")) return false;
    if ($el.find("[uk-grid], .uk-grid, table").length) return false;
    return Boolean(firstContentImage($, $el));
  });
  if (loose.length < 2) return null;

  type Group = { heading?: string; subs: string[]; items: ColumnItem[] };
  const fresh = (): Group => ({ subs: [], items: [] });
  let current = fresh();
  const out: ParsedGrid[] = [];

  const emitGroup = () => {
    if (!current.heading && current.items.length === 0 && current.subs.length === 0) {
      current = fresh();
      return;
    }
    const subs = current.subs.filter(
      (text, index, all) => !all.some((other, otherIndex) => otherIndex !== index && other.length > text.length && other.includes(text)),
    );
    const subheading =
      subs.reduce((acc, text) => {
        if (!acc) return text;
        return `${acc}${/[.!?]$/.test(acc) ? " " : ". "}${text}`;
      }, "") || undefined;
    if (current.items.length === 0) {
      out.push({ mode: "text", columns: 1, heading: current.heading, subheading, items: [] });
    } else {
      const titled = current.items.filter((item) => item.title).length;
      const columns =
        titled === 0 && current.items.length <= 3 ? 1 : current.items.length >= 5 ? 3 : current.items.length >= 2 ? 2 : 1;
      out.push({ mode: "cards", columns, heading: current.heading, subheading, items: current.items });
    }
    current = fresh();
  };

  const addImage = (url: string, title?: string, description?: string) => {
    if (current.items.some((item) => item.image_url && imageSignature(item.image_url) === imageSignature(url))) return;
    current.items.push({
      title: title && title !== current.heading ? title : "",
      description,
      image_url: url,
    });
  };

  for (const el of scope.children().toArray()) {
    const $el = $(el);
    if ($el.attr("data-parsed") === "1") continue;
    if (/\buk-hidden\b/.test($el.attr("class") || "")) continue;

    if ($el.find("table").length && $el.find("[uk-grid], .uk-grid").length === 0) {
      emitGroup();
      const parsed = parseLeafGrid($, $el);
      if (parsed) out.push(parsed);
      continue;
    }

    const inner = $el.find("[uk-grid], .uk-grid").first();
    if (inner.length && isLayoutGrid(inner)) {
      const parsed = parseLeafGrid($, inner);
      if (parsed?.mode === "specs") {
        emitGroup();
        const panelHeading = blockHeading($, $el);
        if (panelHeading && !/^specifications$/i.test(panelHeading)) parsed.heading = panelHeading;
        out.push(parsed);
      } else if (parsed?.mode === "split-row" || parsed?.mode === "banner") {
        emitGroup();
        out.push(parsed);
      } else if (parsed?.mode === "cards") {
        for (const item of parsed.items) {
          if (item.image_url) addImage(item.image_url, item.title, item.description);
        }
      }
      continue;
    }

    const heading = blockHeading($, $el);
    if (heading) {
      if (current.heading) emitGroup();
      current.heading = heading;
      for (const blurb of blockBlurbs($, $el, heading)) {
        if (!current.subs.includes(blurb) && current.subs.join(" ").length < 900) current.subs.push(blurb);
      }
      const withHeading = firstContentImage($, $el);
      if (withHeading) addImage(withHeading);
      continue;
    }

    const img = firstContentImage($, $el);
    if (img) {
      const blurbs = blockBlurbs($, $el);
      // A captioned photo is its own band. Untitled photos only stack under the heading they follow.
      if (blurbs.length || !current.heading) {
        emitGroup();
        for (const blurb of blurbs) current.subs.push(blurb);
        addImage(img);
        emitGroup();
        continue;
      }
      addImage(img);
      continue;
    }

    for (const blurb of blockBlurbs($, $el)) {
      if (!current.subs.includes(blurb) && current.subs.join(" ").length < 900) current.subs.push(blurb);
    }
  }
  emitGroup();
  return out.length ? out : null;
}

function isHiddenBranch($: cheerio.CheerioAPI, node: cheerio.Element): boolean {
  return $(node)
    .parents()
    .addBack()
    .toArray()
    .some((el) => /\buk-hidden\b/.test($(el).attr("class") || ""));
}

function backgroundAsset($el: cheerio.Cheerio<cheerio.Element>): string | undefined {
  const srcset = ($el.attr("data-srcset") || "").split(",")[0]?.trim().split(/\s+/)[0];
  const url = originalAsset($el.attr("data-src") || srcset);
  if (!url || isJunkImage(url) || /spacer|videoholder|qrwechat/i.test(url)) return undefined;
  return url;
}

function backgroundBanner(
  $: cheerio.CheerioAPI,
  el: cheerio.Cheerio<cheerio.Element>,
): ParsedGrid | null {
  const hosts = (/\buk-background\b/.test(el.attr("class") || "") ? el : el.find("[class*='uk-background']"))
    .toArray()
    .map((node) => $(node));
  const host = hosts.find((candidate) => backgroundAsset(candidate));
  if (!host) return null;
  const image = backgroundAsset(host)!;
  const heading = blockHeading($, host);
  if (!heading) return null;
  const visiblePhoto = host.find("img").toArray().some((img) => {
    if (isHiddenBranch($, img)) return false;
    const url = originalAsset($(img).attr("src") || $(img).attr("data-src"));
    return Boolean(url && !/spacer/i.test(url) && !isJunkImage(url));
  });
  if (visiblePhoto) return null;
  const copy = blockBlurbs($, host, heading).filter(
    (text, index, all) => !all.some((other, otherIndex) => otherIndex !== index && other.length > text.length && other.includes(text)),
  );
  return { mode: "banner", columns: 1, heading, subheading: copy.join(" "), image_url: image, items: [] };
}

function firstContentImage($: cheerio.CheerioAPI, el: cheerio.Cheerio<cheerio.Element>): string | undefined {
  const node = el.find("img").addBack("img").toArray().find((img) => {
    if (isHiddenBranch($, img)) return false;
    const raw = $(img).attr("src") || $(img).attr("data-src") || "";
    return raw && !isTinyAsset(raw, $(img).attr("width")) && !isJunkImage(originalAsset(raw) || raw);
  });
  return node ? originalAsset($(node).attr("src") || $(node).attr("data-src")) : undefined;
}

function blockHeading($: cheerio.CheerioAPI, el: cheerio.Cheerio<cheerio.Element>): string | undefined {
  const own = el.is("h1, h2, h3, h4, .el-title, .uk-heading-medium, .uk-heading-small, .uk-h1, .uk-h2, .uk-h3") ? cellText($, el) : "";
  const nested = cellText($, el.find("h1, h2, h3, h4, .el-title, .uk-heading-medium, .uk-heading-small, .uk-h1, .uk-h2, .uk-h3").first());
  const text = own || nested;
  if (!text || text.length < 2 || text.length > 160) return undefined;
  if (/follow us|cookie|privacy/i.test(text)) return undefined;
  return text;
}

function blockBlurbs($: cheerio.CheerioAPI, el: cheerio.Cheerio<cheerio.Element>, heading?: string): string[] {
  const found: string[] = [];
  const push = (text: string) => {
    if (text.length < 20 || text.length > 1200 || text === heading) return;
    if (/wavelength|cookie|privacy/i.test(text)) return;
    if (!found.includes(text)) found.push(text);
  };
  const blocks = el.find(".el-meta, .el-content");
  (blocks.length ? blocks : el.find("p")).each((_, node) => push(cellText($, $(node))));
  if (found.length === 0 && heading) {
    const full = cellText($, el);
    if (full.startsWith(heading)) push(full.slice(heading.length).trim());
  }
  const prose = found.filter((text) => !text.startsWith("*"));
  const notes = found.filter((text) => text.startsWith("*"));
  return prose.length ? [...prose, ...notes] : found;
}

/**
 * A single YOOtheme column sometimes holds two bands: a labelled diagram,
 * then a promotional video. Split those into their own sections.
 */
function isIconBullet(img: cheerio.Cheerio<cheerio.Element>): boolean {
  const width = Number(img.attr("width") || 0);
  const thumb = /thumbnail=(\d+)/i.exec(img.attr("src") || "");
  if (width > 0 && width <= 48) return true;
  if (thumb && Number(thumb[1]) <= 48) return true;
  return false;
}

/**
 * A wide diagram with a list of tiny marker icons beside short captions.
 * The markers are counters, not the illustration.
 */
function illustrationList(
  $: cheerio.CheerioAPI,
  grid: cheerio.Cheerio<cheerio.Element>,
): ParsedGrid | null {
  const lists = grid.find("ul").filter((_, ul) => {
    const nearest = $(ul).parents("[uk-grid], .uk-grid").first();
    return nearest.get(0) === grid.get(0);
  });
  if (lists.length !== 1) return null;
  const list = lists.first();
  const extraNested = grid
    .find("[uk-grid], .uk-grid")
    .toArray()
    .filter((nested) => $(nested).closest("ul").length === 0);
  if (extraNested.length > 0) return null;

  const items: ColumnItem[] = [];
  list.children("li").each((_, li) => {
    const $li = $(li);
    const icon = $li.find("img").first();
    if (!icon.length || !isIconBullet(icon)) return;
    const title = cellText($, $li).replace(/\s+/g, " ").trim();
    const image = originalAsset(icon.attr("src") || icon.attr("data-src"));
    if (title.length < 3 || title.length > 180 || !image) return;
    items.push({ title, image_url: image });
  });
  if (items.length < 2) return null;

  const pictures: string[] = [];
  grid.find("img").each((_, img) => {
    const $img = $(img);
    if (list.find(img).length || isIconBullet($img)) return;
    const insideNested = extraNested.some((nested) => $(nested).find(img).length);
    if (insideNested) return;
    const url = originalAsset($img.attr("src") || $img.attr("data-src"));
    if (!url || /spacer/i.test(url) || pictures.includes(url)) return;
    pictures.push(url);
  });
  if (pictures.length !== 1) return null;

  const heading = cellText($, grid.find("h1, h2, h3, h4, .el-title").first());
  const columns = /uk-column-1-2/.test(list.attr("class") || "") ? 2 : 1;
  return {
    mode: "diagram",
    columns,
    heading: heading && heading.length < 120 ? heading : undefined,
    image_url: pictures[0],
    items,
  };
}

function explodeMixedMedia(
  $: cheerio.CheerioAPI,
  grid: cheerio.Cheerio<cheerio.Element>,
): ParsedGrid[] | null {
  const videoEl = grid.find("video").first();
  if (!videoEl.length || !grid.find("img").length) return null;
  const column = videoEl.closest(".uk-width-1-1");
  const scope = column.length ? column : grid;
  const rawImage = scope
    .find("img")
    .toArray()
    .map((img) => $(img).attr("src") || $(img).attr("data-src"))
    .find((src) => src && !isTinyAsset(src, undefined));
  const image = originalAsset(rawImage);
  const labels = [
    ...new Set(
      scope
        .find(".el-item")
        .toArray()
        .map((node) => cellText($, $(node)))
        .filter((text) => text.length > 2 && text.length < 60),
    ),
  ];
  const headings = scope
    .find("h1, h2, h3")
    .toArray()
    .map((node) => cellText($, $(node)))
    .filter((text) => text.length > 1);
  const video = absoluteUrl(videoEl.attr("src"))?.replace(/ /g, "%20");
  const parts: ParsedGrid[] = [];
  if (image) {
    parts.push({
      mode: labels.length >= 3 ? "diagram" : "cards",
      columns: 1,
      heading: headings[0],
      image_url: image,
      items: labels.length
        ? labels.map((title) => ({ title }))
        : [{ title: headings[0] || "", image_url: image }],
    });
  }
  if (video) {
    parts.push({
      mode: "split-row",
      columns: 1,
      heading: headings[1] || "Video",
      video_url: video,
      items: [],
    });
  }
  return parts.length ? parts : null;
}

/**
 * Walks the manufacturer page in document order and keeps each visual row:
 * a heading, a two-column image/text pair, a card grid, or the comparison table.
 * Yootheme marks rows with the uk-grid attribute, not only the uk-grid class.
 */
/**
 * A manufacturer hero is one full-bleed background with a wide product photo
 * floating in the middle and small wordmarks at the edges.
 */
function coverHero(
  $: cheerio.CheerioAPI,
  section: cheerio.Cheerio<cheerio.Element>,
): ParsedGrid | null {
  if (!section.is(".uk-section")) return null;
  const background = backgroundAsset(section);
  if (!background) return null;
  const grid = section.find("[uk-grid], .uk-grid").first();
  if (!grid.length) return null;
  const images = grid
    .children()
    .toArray()
    .flatMap((child) => {
      if (/\buk-hidden\b/.test($(child).attr("class") || "")) return [];
      const url = firstContentImage($, $(child));
      return url ? [url] : [];
    });
  if (images.length !== 2) return null;
  grid.attr("data-parsed", "1");
  return {
    mode: "hero",
    columns: 1,
    image_url: background,
    items: images.map((url) => ({ title: "", image_url: url })),
  };
}

function stageHero(
  $: cheerio.CheerioAPI,
  section: cheerio.Cheerio<cheerio.Element>,
): ParsedGrid | null {
  if (!section.is(".uk-section")) return null;
  if (section.find("video, iframe").length) return null;
  const background = backgroundAsset(section);
  if (!background || isJunkImage(background)) return null;

  const seen = new Set<string>();
  const images: { url: string; width: number }[] = [];
  section.find("img").each((_, node) => {
    const $img = $(node);
    if ($img.parents().toArray().some((parent) => /\buk-hidden\b/.test($(parent).attr("class") || ""))) return;
    const url = originalAsset($img.attr("src") || $img.attr("data-src"));
    if (!url || /spacer/i.test(url) || isJunkImage(url)) return;
    const signature = imageSignature(url);
    if (seen.has(signature)) return;
    seen.add(signature);
    images.push({ url, width: Number($img.attr("width") || 0) });
  });
  if (images.length < 3 || images.length > 6) return null;
  const center = images.reduce((widest, image) => (image.width > widest.width ? image : widest));
  if (center.width < 600) return null;
  const overlays = images.filter((image) => image !== center);
  if (overlays.length < 2 || overlays.some((image) => image.width > 500)) return null;

  return {
    mode: "hero",
    columns: 1,
    image_url: background,
    items: [{ title: "", image_url: center.url }],
    overlay_images: overlays.map((image) => image.url),
  };
}

/** A full-bleed photo with a headline over it, as on the manufacturer's lifestyle bands. */
function posterBand(
  $: cheerio.CheerioAPI,
  section: cheerio.Cheerio<cheerio.Element>,
): ParsedGrid | null {
  const cls = section.attr("class") || "";
  if (!/\buk-section\b/.test(cls)) return null;
  const background = originalAsset(section.attr("data-src") || (section.attr("data-srcset") || "").split(",")[0]);
  if (!background || /spacer|videoholder|qrwechat/i.test(background) || isJunkImage(background)) return null;
  if (section.find("table, video, iframe").length) return null;
  const heading = cellText($, section.find("h1, h2").first()).replace(/\s+/g, " ").trim();
  if (heading.length < 8 || heading.length > 160) return null;
  let photos = 0;
  section.find("img").each((_, img) => {
    const url = originalAsset($(img).attr("src") || $(img).attr("data-src"));
    if (!url || /spacer|logo|apple|google|qrwechat/i.test(url) || isJunkImage(url)) return;
    photos += 1;
  });
  if (photos > 0) return null;
  return {
    mode: "poster",
    columns: 1,
    heading,
    image_url: background,
    align: section.find(".uk-text-right").length ? "end" : "start",
    items: [],
  };
}

function contentPhotos(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<cheerio.Element>,
): { url: string; title?: string }[] {
  const seen = new Set<string>();
  const photos: { url: string; title?: string }[] = [];
  root.find("img").each((_, node) => {
    const url = originalAsset($(node).attr("src") || $(node).attr("data-src"));
    if (!url || /spacer|videoholder/i.test(url) || isJunkImage(url)) return;
    const signature = imageSignature(url);
    if (seen.has(signature)) return;
    seen.add(signature);
    const title = cellText($, $(node).closest(".el-item, .uk-panel").find("h2, h3").first())
      .replace(/\s+/g, " ")
      .trim();
    photos.push({ url, title: title && title.length < 140 ? title : undefined });
  });
  return photos;
}

function textCaptions(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<cheerio.Element>,
): ColumnItem[] {
  const items: ColumnItem[] = [];
  root.find("h3").each((_, node) => {
    const title = cellText($, $(node)).replace(/\s+/g, " ").trim();
    if (!title || items.some((item) => item.title === title)) return;
    const description = cellText($, $(node).parent().find(".el-content").first())
      .replace(/\s+/g, " ")
      .trim();
    items.push({
      title,
      description: description && description !== title ? description : undefined,
    });
  });
  return items;
}

/** Two-column manufacturer band: a scene photo beside captioned photos or copy. */
function asidePair(
  $: cheerio.CheerioAPI,
  grid: cheerio.Cheerio<cheerio.Element>,
): ParsedGrid | null {
  if (!isLayoutGrid(grid)) return null;
  const cols = grid.children().filter((_, el) => /uk-width-/.test($(el).attr("class") || ""));
  if (cols.length !== 2) return null;
  const panels = cols.toArray().map((el) => {
    const column = $(el);
    const background = originalAsset(column.find("[data-src]").addBack("[data-src]").first().attr("data-src"));
    const photos = contentPhotos($, column);
    const heading = cellText($, column.find("h2, h3").first()).replace(/\s+/g, " ").trim();
    const captions = textCaptions($, column);
    const scene = background && !/spacer|videoholder/i.test(background) && !isJunkImage(background)
      ? background
      : undefined;
    return { scene, photos, heading, captions };
  });
  const unequal = cols.toArray().some((el) => /uk-width-[23]-5/.test($(el).attr("class") || ""));
  const wideIndex = cols.toArray().findIndex((el) => /uk-width-3-5/.test($(el).attr("class") || ""));
  let sceneIndex = wideIndex >= 0 && (panels[wideIndex].scene || panels[wideIndex].photos.length === 1)
    ? wideIndex
    : panels.findIndex(
        (panel) => (panel.scene || panel.photos.length === 1) && panel.captions.length <= 1 && panel.photos.length <= 1,
      );
  if (sceneIndex < 0) return null;
  if (!unequal && panels.every((panel) => panel.photos.length === 1 && !panel.scene)) return null;
  const other = panels[1 - sceneIndex];
  const scene = panels[sceneIndex];
  const items = other.photos.some((photo) => photo.title)
    ? other.photos.filter((photo) => photo.title).map((photo) => ({ title: photo.title!, image_url: photo.url }))
    : other.captions;
  if (items.length === 0) return null;
  return {
    mode: "aside",
    columns: 2,
    heading: scene.heading || scene.photos[0]?.title,
    image_url: scene.scene || scene.photos[0]?.url,
    items,
  };
}

export function parseMaxspectHtmlCheerio(
  html: string,
  _sourceUrl: string,
  title: string,
  slug: string,
): Partial<ProductPage> {
  const $ = cheerio.load(html);
  const darkIds = blackBandIds($);
  $(
    "script, style, noscript, header, footer, nav, .tm-header, .tm-header-mobile, .uk-offcanvas, #tm-dialog-mobile, .uk-navbar-dropdown",
  ).remove();

  const root = $("#tm-main").first();
  const scope = root.length ? root : $("body");
  const grids: ParsedGrid[] = [];
  const headings: { text: string; at: number; sub?: string }[] = [];

  const walk = (el: cheerio.Element) => {
    const $el = $(el);
    if (/\buk-hidden\b/.test($el.attr("class") || "")) return;
    if ($el.attr("data-parsed") === "1") return;
    if (grids.length === 0) {
      const cover = coverHero($, $el);
      if (cover) {
        grids.push(cover);
      } else {
        const stage = stageHero($, $el);
        if (stage) {
          grids.push(stage);
          return;
        }
      }
    }
    const poster = posterBand($, $el);
    if (poster) {
      grids.push(poster);
      return;
    }
    const banner = backgroundBanner($, $el);
    const bannerIsThisElement =
      /\buk-background\b/.test($el.attr("class") || "") || $el.find("[uk-grid], .uk-grid").length <= 1;
    if (banner && bannerIsThisElement && !$el.is(".uk-section") && !$el.find(".uk-section").length) {
      grids.push(banner);
      return;
    }
    if (!isLayoutGrid($el)) {
      $el.children("video").each((_, node) => {
        const abs = absoluteUrl($(node).attr("src"))?.replace(/ /g, "%20");
        if (abs && /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(abs)) {
          grids.push({ mode: "split-row", columns: 1, video_url: abs, items: [] });
        }
      });
    }
    if (isLayoutGrid($el)) {
      const aside = asidePair($, $el);
      if (aside) {
        grids.push(aside);
        return;
      }
      const listed = illustrationList($, $el);
      if (listed) {
        grids.push(listed);
        return;
      }
      const sequenced = stackedColumnGrids($, $el);
      if (sequenced) {
        grids.push(...sequenced);
        return;
      }
      const nestedGrids = $el.find("[uk-grid], .uk-grid");
      if (nestedGrids.length > 0) {
        $el.children().each((_, child) => {
          const $child = $(child);
          if (!$child.find("[uk-grid], .uk-grid, table").length) {
            const img = firstContentImage($, $child);
            if (img && !blockHeading($, $child)) {
              grids.push({ mode: "cards", columns: 1, items: [{ title: "", image_url: img }] });
              return;
            }
          }
          walk(child);
        });
        return;
      }
      const mixed = explodeMixedMedia($, $el);
      if (mixed) {
        grids.push(...mixed);
        return;
      }
      const parsed = parseLeafGrid($, $el);
      if (parsed) grids.push(parsed);
      return;
    }
    if ($el.is("h1, h2, h3, .el-title, .uk-h1, .uk-heading-medium")) {
      const text = cellText($, $el);
      if (text && text.length > 1 && text.length < 90 && !/follow us|cookie|privacy/i.test(text)) {
        const blurb = cellText($, $el.closest(".uk-panel").find(".el-content").first());
        const pending = headings.find((heading) => heading.at === grids.length);
        if (pending) {
          grids.push({
            mode: "text",
            columns: 1,
            heading: pending.text,
            subheading: pending.sub,
            items: [],
          });
          headings.splice(headings.indexOf(pending), 1);
        }
        headings.push({
          text,
          at: grids.length,
          sub: blurb && blurb !== text && blurb.length > 20 && blurb.length < 700 ? blurb : undefined,
        });
      }
      if ($el.find("[uk-grid], .uk-grid").length) {
        $el.children().each((_, child) => walk(child));
      }
      return;
    }
    if ($el.find("table").length > 0 && $el.find("[uk-grid], .uk-grid").length === 0) {
      const parsed = parseLeafGrid($, $el);
      if (parsed) grids.push(parsed);
      return;
    }
    $el.children().each((_, child) => walk(child));
  };
  scope.children().each((_, child) => walk(child));

  // Attach each heading to the grids that follow it, until the next heading.
  const sections: DraftSection[] = [];
  const features: { title: string; description: string }[] = [];
  const specs: Record<string, string> = {};
  const galleryImages: string[] = [];

  const headingAt = new Map<number, { text: string; sub?: string }>();
  for (const heading of headings) headingAt.set(heading.at, heading);

  let current: DraftSection | null = null;
  const flush = () => {
    if (!current) return;
    const meaningful =
      current.heading ||
      current.subheading ||
      current.image_url ||
      current.video_url ||
      current.items.length > 0 ||
      current.specs_table;
    if (meaningful) sections.push(current);
    current = null;
  };
  const ensure = () => {
    if (!current) current = { type: "feature_block", items: [] };
    return current;
  };

  const applyHeading = (heading: { text: string; sub?: string } | undefined) => {
    if (!heading) return;
    if (current && (current.items.length || current.video_url || current.image_url || current.specs_table || current.subheading)) {
      flush();
    }
    const sec = ensure();
    if (!sec.heading) sec.heading = heading.text;
    if (heading.sub && !sec.subheading) sec.subheading = heading.sub;
  };

  grids.forEach((grid, index) => {
    if (grid.mode === "hero") {
      flush();
      sections.push({
        type: "full_width_hero",
        image_url: grid.image_url,
        items: grid.items,
        overlay_images: grid.overlay_images,
      });
      current = null;
      return;
    }
    if (grid.mode === "banner") {
      flush();
      sections.push({
        type: "feature_block",
        layout: "banner",
        heading: grid.heading,
        subheading: grid.subheading,
        image_url: grid.image_url,
        items: [],
      });
      current = null;
      return;
    }
    if (grid.mode === "poster") {
      flush();
      sections.push({
        type: "feature_block",
        layout: "poster",
        heading: grid.heading,
        image_url: grid.image_url,
        align: grid.align,
        items: [],
      });
      current = null;
      return;
    }
    if (grid.mode === "aside") {
      flush();
      sections.push({
        type: "feature_block",
        layout: "aside",
        heading: grid.heading,
        image_url: grid.image_url,
        items: grid.items,
        columns: 2,
      });
      current = null;
      return;
    }
    const pendingHeading = headingAt.get(index);
    const genericSpecsHeading = /^(LED Channels|Specifications)$/i.test(grid.heading || "");
    if (pendingHeading && (!grid.heading || genericSpecsHeading)) applyHeading(pendingHeading);

    if (grid.mode === "specs" && grid.specs_table) {
      if (current && (current.items.length || current.video_url || current.image_url)) flush();
      const previous = sections[sections.length - 1];
      const tableHeading = grid.heading || "Specifications";
      const headingAlreadyShown =
        previous?.type === "feature_block" &&
        previous.heading === tableHeading &&
        previous.items.length > 0 &&
        previous.items.every((item) => item.image_url && !item.title);
      const sec = ensure();
      sec.type = "tech_specs_table";
      sec.heading = headingAlreadyShown ? undefined : sec.heading || tableHeading;
      sec.subheading = grid.note;
      sec.image_url = grid.image_url;
      sec.specs_table = grid.specs_table;
      for (const [row, cols] of Object.entries(grid.specs_table)) {
        specs[row] = Object.entries(cols)
          .map(([model, value]) => `${model}: ${value}`)
          .join(" · ");
      }
      flush();
      return;
    }

    if (grid.mode === "text") {
      if (
        current &&
        (current.items.length ||
          current.image_url ||
          current.video_url ||
          current.specs_table ||
          (current.heading && current.heading !== grid.heading))
      ) {
        flush();
      }
      const sec = ensure();
      sec.heading = sec.heading || grid.heading;
      sec.subheading = sec.subheading || grid.subheading;
      return;
    }

    if (grid.mode === "diagram") {
      flush();
      sections.push({
        type: "diagram_callout",
        heading: grid.heading,
        image_url: grid.image_url,
        items: grid.items,
        columns: grid.columns,
      });
      current = null;
      return;
    }

    if (grid.mode === "split-row" && grid.video_url && grid.items.length === 0) {
      if (!grid.subheading) {
        if (
          current &&
          current.heading &&
          !current.items.length &&
          !current.image_url &&
          !current.video_url &&
          !current.specs_table
        ) {
          current.type = "video_embed";
          current.video_url = grid.video_url;
          flush();
          return;
        }
        flush();
        sections.push({
          type: "video_embed",
          heading: grid.heading,
          items: [],
          video_url: grid.video_url,
        });
        current = null;
        return;
      }
      if (grid.heading && current?.heading && current.heading !== grid.heading) flush();
      const sec = ensure();
      sec.layout = "split";
      sec.heading = sec.heading || grid.heading;
      sec.subheading = sec.subheading || grid.subheading;
      sec.video_url = grid.video_url;
      return;
    }

    if (grid.mode === "split-row") {
      if (grid.columns === 4) flush();
      const sec = ensure();
      sec.layout = "split";
      sec.columns = grid.columns || sec.columns;
      if (grid.heading && !sec.heading) sec.heading = grid.heading;
      if (grid.subheading && !sec.subheading) sec.subheading = grid.subheading;
      sec.items.push(...grid.items);
      if (grid.columns === 4) flush();
      return;
    }

    const seenImages = new Set<string>();
    for (const item of [...(current?.items || []), ...(sections[sections.length - 1]?.items || [])]) {
      if (item.image_url) seenImages.add(imageSignature(item.image_url));
    }
    if (
      grid.items.length >= 4 &&
      grid.items.every((item) => item.image_url && seenImages.has(imageSignature(item.image_url)))
    ) {
      return;
    }

    if (
      grid.heading &&
      current?.heading &&
      current.heading !== grid.heading &&
      (current.items.length || current.image_url || current.video_url || current.subheading)
    ) {
      flush();
    }
    const solo = grid.items.length === 1 ? grid.items[0] : undefined;
    const soloIsSection = Boolean(
      solo?.title && solo.description && solo.image_url && solo.title.length > 40,
    );
    if (current?.image_url && soloIsSection) flush();
    if (current?.image_url && grid.items.filter((item) => item.title).length >= 4) flush();
    const incomingUntitled = !grid.heading && grid.items.length > 0 && grid.items.every((item) => !item.title);
    const currentTitled = (current?.items || []).filter((item) => item.title).length;
    // Keep a short titled row with the photos that follow it (habitat presets).
    // A full icon row, and a run of untitled photo bands, each stay their own section.
    const continuation = incomingUntitled && currentTitled > 0 && currentTitled <= 2;
    if (current && current.items.length > 0 && current.layout === "grid" && !continuation) flush();
    if (
      current?.layout === "split" &&
      grid.items.length > 1 &&
      grid.items.some((item) => item.title)
    ) {
      flush();
    }
    const imageOnly =
      grid.items.length === 1 &&
      grid.items[0].image_url &&
      !grid.items[0].title &&
      !grid.items[0].description &&
      grid.columns === 1;
    if (imageOnly) {
      const url = grid.items[0].image_url!;
      if (
        current &&
        (current.items.length ||
          current.video_url ||
          current.specs_table ||
          (current.image_url && current.image_url !== url) ||
          (current.heading && grid.heading && current.heading !== grid.heading))
      ) {
        flush();
      }
      const next = ensure();
      if (grid.heading && !next.heading) next.heading = grid.heading;
      if (grid.subheading && !next.subheading) next.subheading = grid.subheading;
      next.image_url = url;
      galleryImages.push(url);
      return;
    }
    const sec = ensure();
    if (grid.heading && !sec.heading) sec.heading = grid.heading;
    if (grid.subheading && !sec.subheading) sec.subheading = grid.subheading;
    if (solo?.title && solo.description && solo.image_url && solo.title.length > 40 && !sec.heading) {
      sec.heading = solo.title;
      sec.subheading = sec.subheading || solo.description;
      sec.image_url = solo.image_url;
      return;
    }
    sec.layout = "grid";
    sec.columns = Math.max(sec.columns || 0, grid.columns || 0) || grid.columns;
    sec.items.push(...grid.items);
  });
  if (headingAt.has(grids.length)) applyHeading(headingAt.get(grids.length));
  flush();

  for (const sec of sections) {
    for (const item of sec.items) {
      if (item.image_url) galleryImages.push(item.image_url);
      if (item.title && item.description && features.length < 8) {
        features.push({ title: item.title, description: item.description });
      }
    }
    if (sec.image_url) galleryImages.push(sec.image_url);
    for (const url of sec.overlay_images || []) galleryImages.push(url);
  }

  const heroImg = galleryImages.find((url) => /hero|mainpic|frontpage|banner/i.test(url) && !/logo|badge/i.test(url));
  const normalizeHeading = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const darkHeadingKeys = new Set<string>();
  scope.find(".uk-section").each((_, node) => {
    const section = $(node);
    if (!bandIsDark($, section, darkIds)) return;
    section.find("h1, h2, h3, h4, .el-title, .uk-h1, .uk-heading-medium").each((__, heading) => {
      const text = cellText($, $(heading));
      if (text.length > 2 && text.length < 180) darkHeadingKeys.add(normalizeHeading(text));
    });
  });
  const built: ProductContentSection[] = sections.map((sec, idx) => ({
    id: `sec-${slug}-${idx + 1}`,
    type: sec.type,
    heading: sec.heading,
    subheading: sec.subheading,
    image_url: sec.image_url,
    video_url: sec.video_url,
    overlay_images: sec.overlay_images,
    layout: sec.layout,
    columns: sec.columns,
    align: sec.align,
    items: sec.items.length ? sec.items : undefined,
    specs_table: sec.specs_table,
    surface:
      sec.layout === "poster"
        ? undefined
        : sec.heading && darkHeadingKeys.has(normalizeHeading(sec.heading))
          ? "dark"
          : undefined,
    source_order: idx,
  }));

  const openingPair = built[0];
  const openingVideo = built[1];
  const pairItems = openingPair?.items || [];
  if (
    openingPair?.type === "feature_block" &&
    !openingPair.heading &&
    pairItems.length === 2 &&
    pairItems.every((item) => item.image_url && !item.title) &&
    openingVideo?.type === "video_embed" &&
    openingVideo.video_url &&
    !openingVideo.heading
  ) {
    openingVideo.overlay_images = pairItems.map((item) => item.image_url!).slice(0, 2);
    built.shift();
    built.forEach((sec, idx) => {
      sec.source_order = idx;
    });
  }

  if (heroImg) {
    built.unshift({
      id: `sec-${slug}-hero`,
      type: "full_width_hero",
      heading: title,
      image_url: heroImg,
      source_order: 0,
    });
    built.forEach((sec, idx) => {
      sec.source_order = idx;
    });
  }

  return {
    title,
    hero_image: heroImg,
    gallery_images: [...new Set(galleryImages)],
    sections: built,
    features: features.slice(0, 8),
    specs,
  };
}

function originalAsset(src: string | undefined): string | undefined {
  if (!src) return undefined;
  const fromQuery = /[?&]src=([^&]+)/i.exec(src);
  const raw = fromQuery ? decodeURIComponent(fromQuery[1]) : src;
  return absoluteUrl(raw.startsWith("images/") ? `/${raw}` : raw);
}

function isTinyAsset(src: string, width?: string): boolean {
  if (isJunkImage(src) || /spacer|qrwechat/i.test(src)) return true;
  const original = originalAsset(src);
  if (original && isJunkImage(original)) return true;
  // YOOtheme often displays a full product image at icon size. The file behind ?src= is the asset.
  if (/[?&]src=/i.test(src)) return false;
  const thumb = /thumbnail=(\d+)/i.exec(src);
  if (thumb && Number(thumb[1]) < 160) return true;
  if (width && Number(width) > 0 && Number(width) < 120) return true;
  return false;
}

/**
 * One UK section per visual band on the manufacturer page.
 * A band is a top-level YOOtheme uk-section: a hero, a full-width video,
 * a diagram, an image row, or a spec table.
 */
export function parseMaxspectBands(
  html: string,
  title: string,
  slug: string,
): Partial<ProductPage> {
  const $ = cheerio.load(html);
  $(
    "script, style, noscript, header, footer, nav, .tm-header, .tm-header-mobile, .uk-offcanvas",
  ).remove();

  const bands = $("#tm-main .uk-section").filter((_, el) => $(el).parents(".uk-section").length === 0);
  const sections: ProductContentSection[] = [];
  const gallery: string[] = [];

  bands.each((index, el) => {
    const $band = $(el);
    const cls = $band.attr("class") || "";
    if (/\buk-hidden\b/.test(cls)) return;

    const heading = cellText($, $band.find("h1, h2").first()) || undefined;
    const subheading =
      $band
        .find("p, .el-content")
        .toArray()
        .map((node) => cellText($, $(node)))
        .find((text) => text.length > 20 && text !== heading) || undefined;

    const videos: string[] = [];
    $band.find("video source, video, source").each((_, node) => {
      const abs = absoluteUrl($(node).attr("src"));
      if (abs && /\.(mp4|webm)(\?|$)/i.test(abs) && !videos.includes(abs)) videos.push(abs);
    });

    const images: string[] = [];
    $band.find("img").each((_, img) => {
      const abs = originalAsset($(img).attr("src") || $(img).attr("data-src"));
      if (!abs || isTinyAsset(abs, $(img).attr("width"))) return;
      if (!images.includes(abs)) images.push(abs);
    });
    const background = originalAsset($band.attr("data-src") || $band.find("[data-src]").first().attr("data-src"));
    if (background && !isTinyAsset(background) && !images.includes(background)) images.unshift(background);

    const labels = [
      ...new Set(
        $band
          .find("li, h3, h4")
          .toArray()
          .map((node) => cellText($, $(node)))
          .filter((text) => text.length > 2 && text.length < 90 && text !== heading),
      ),
    ].slice(0, 12);

    let specsTable: Record<string, Record<string, string>> | undefined;
    let widest = 0;
    $band.find("table").each((_, table) => {
      const cols = $(table).find("tr").first().find("th, td").length;
      if (cols > widest) {
        widest = cols;
        specsTable = parseTable($, $(table))?.specs;
      }
    });

    images.forEach((url) => gallery.push(url));
    const contentImages = images.filter((url) => !/logo|badge|patented|3_logos/i.test(url));

    if (videos.length && contentImages.length === 0 && !specsTable) {
      sections.push({
        id: `band-${slug}-${sections.length + 1}`,
        type: "video_embed",
        heading,
        subheading,
        video_url: videos[0],
        source_order: sections.length,
      });
      return;
    }

    if (specsTable) {
      sections.push({
        id: `band-${slug}-${sections.length + 1}`,
        type: "tech_specs_table",
        heading: heading || "Specifications",
        subheading,
        image_url: contentImages[0],
        secondary_images: contentImages[1] ? [contentImages[1]] : undefined,
        specs_table: specsTable,
        source_order: sections.length,
      });
      return;
    }

    if (index === 0 && /\buk-background\b/.test(cls) && images.length > 0) {
      sections.push({
        id: `band-${slug}-${sections.length + 1}`,
        type: "full_width_hero",
        heading: heading || title,
        image_url: images.find((url) => /hero|mainpic|frontpage/i.test(url)) || contentImages[0] || images[0],
        overlay_images: images.filter((url) => /logo|3_logos|patented/i.test(url)).slice(0, 2),
        source_order: sections.length,
      });
      return;
    }

    if (contentImages.length === 1 && labels.length >= 4) {
      sections.push({
        id: `band-${slug}-${sections.length + 1}`,
        type: "diagram_callout",
        heading,
        subheading,
        image_url: contentImages[0],
        items: labels.map((label) => ({ title: label })),
        source_order: sections.length,
      });
      return;
    }

    if (contentImages.length > 0) {
      const wide = contentImages.length >= 5;
      const itemImages = wide ? contentImages.slice(1) : contentImages;
      const captions = labels.length === itemImages.length ? labels : [];
      const columns = itemImages.length >= 5 ? 5 : itemImages.length === 4 ? 2 : Math.min(itemImages.length, 3);
      sections.push({
        id: `band-${slug}-${sections.length + 1}`,
        type: wide ? "water_flow_improvement" : "feature_block",
        layout: wide ? undefined : "grid",
        columns,
        heading,
        subheading,
        image_url: wide ? contentImages[0] : undefined,
        items: itemImages.map((url, i) => ({
          title: captions[i] || "",
          image_url: url,
        })),
        source_order: sections.length,
      });
      return;
    }

    if (heading || subheading) {
      sections.push({
        id: `band-${slug}-${sections.length + 1}`,
        type: "feature_block",
        heading,
        subheading,
        source_order: sections.length,
      });
    }
  });

  const hero = sections.find((sec) => sec.type === "full_width_hero")?.image_url;
  return {
    title,
    hero_image: hero,
    gallery_images: [...new Set(gallery)],
    sections,
    features: [],
    specs: {},
  };
}
