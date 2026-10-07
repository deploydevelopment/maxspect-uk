import { ProductContentSection } from "./catalog.types";

/**
 * A section is "visible" on the live/pending product page only if it has been
 * pulled through the section pipeline (pending) or approved. Not-synced and
 * rejected sections are hidden so the page builds up one section at a time.
 */
export function isSectionVisible(sec: ProductContentSection): boolean {
  return sec.sync_status === "approved" || sec.sync_status === "pending";
}

/** The full-width hero image section, if it has been pulled/approved. */
export function findHeroSection(
  sections: ProductContentSection[] | undefined,
): ProductContentSection | undefined {
  return sections?.find(
    (s) => s.type === "full_width_hero" && !!s.image_url && isSectionVisible(s),
  );
}

/** A leading video section (first section, video type) that has been pulled. */
export function findLeadingVideo(
  sections: ProductContentSection[] | undefined,
): ProductContentSection | undefined {
  if (!sections || sections.length === 0) return undefined;
  const first = sections[0];
  if (first.type === "video_embed" && first.video_url && isSectionVisible(first)) {
    return first;
  }
  return undefined;
}

/** Sections to render in the body (visible, excluding hero + leading video). */
export function bodySections(
  sections: ProductContentSection[] | undefined,
): ProductContentSection[] {
  if (!sections) return [];
  return sections.filter((sec, idx) => {
    if (!isSectionVisible(sec)) return false;
    if (sec.type === "full_width_hero") return false;
    if (idx === 0 && sec.type === "video_embed" && sec.video_url) return false;
    return true;
  });
}
