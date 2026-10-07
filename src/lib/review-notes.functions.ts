import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getReviewFlags,
  addReviewFlag,
  removeReviewFlag,
  resolveReviewFlag,
  getOpenFlagCounts,
} from "./review-notes.server";

export const getFlags = createServerFn({ method: "GET" })
  .validator((slug: string) => z.string().min(1).parse(slug))
  .handler(async ({ data: slug }) => getReviewFlags(slug));

export const saveFlag = createServerFn({ method: "POST" })
  .validator((input: { slug: string; pane: "source" | "local"; category: string; note: string }) =>
    z
      .object({
        slug: z.string().min(1),
        pane: z.enum(["source", "local"]),
        category: z.string().min(1),
        note: z.string().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => addReviewFlag(data.slug, data.pane, data.category, data.note));

export const deleteFlag = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => removeReviewFlag(data.id));

export const resolveFlag = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => resolveReviewFlag(data.id));

export const getOpenCounts = createServerFn({ method: "POST" })
  .validator((input: { slugs: string[] }) =>
    z.object({ slugs: z.array(z.string().min(1)).max(500) }).parse(input),
  )
  .handler(async ({ data }) => getOpenFlagCounts(data.slugs));
