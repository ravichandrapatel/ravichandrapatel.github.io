import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Publish instant (ISO). Future dates stay out of production builds until cron deploy. */
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Hard hide — not scheduled. Prefer future `pubDate` for timed release. */
    draft: z.boolean().default(false),
    /** Public path to cover image, e.g. `/posts/github-idp/cover-01.png` (static assets under public/posts/) */
    cover: z.string().optional(),
  }),
});

export const collections = { posts };
