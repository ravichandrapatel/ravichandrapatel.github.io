// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// User site (repo must be ravichandrapatel.github.io):
// https://ravichandrapatel.github.io/
export default defineConfig({
  site: "https://ravichandrapatel.github.io",
  base: "/",
  trailingSlash: "always",
  integrations: [
    react(),
    mdx(),
    sitemap({
      // Drafts + future pubDates are omitted from getStaticPaths (see src/lib/posts.ts).
      filter: (page) => !page.includes("google"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
