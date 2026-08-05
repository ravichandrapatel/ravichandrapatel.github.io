// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { copyFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

/** Alias /sitemap.xml → sitemap-index.xml so GSC's common default URL works. */
function sitemapXmlAlias() {
  return {
    name: "sitemap-xml-alias",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const out = fileURLToPath(dir);
        const indexPath = path.join(out, "sitemap-index.xml");
        const aliasPath = path.join(out, "sitemap.xml");
        try {
          await access(indexPath);
          await copyFile(indexPath, aliasPath);
        } catch {
          // No index yet (empty site) — skip alias.
        }
      },
    },
  };
}

// User site (repo must be ravichandrapatel.github.io):
// https://ravichandrapatel.github.io/
export default defineConfig({
  site: "https://ravichandrapatel.github.io",
  base: "/",
  trailingSlash: "always",
  redirects: {
    "/posts": "/notes/",
    "/posts/[...slug]": "/notes/[...slug]",
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      // Drafts + future pubDates are omitted from getStaticPaths (see src/lib/posts.ts).
      filter: (page) => !page.includes("google") && !page.includes("/404"),
    }),
    sitemapXmlAlias(),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Keep island deps in the Vite prebundle so client:load hydration
      // does not 404 after lockfile / font installs re-optimize the cache.
      include: ["framer-motion", "lucide-react", "react", "react-dom", "react/jsx-runtime"],
    },
  },
});
