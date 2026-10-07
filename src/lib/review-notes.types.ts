export interface ReviewFlag {
  id: string;
  slug: string;
  pane: "source" | "local";
  category: string;
  note: string;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export const FLAG_CATEGORIES = [
  "Wrong section",
  "Missing content",
  "Wrong order",
  "Wrong image/media",
  "Styling issue",
  "Other",
] as const;
