// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { readFile, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Emit a clean /sitemap.xml urlset for Google Search Console.
 * Astro's sitemap-index + sitemap-0 (with unused news/image/video xmlns) often
 * surfaces as "Sitemap could not be read" for small sites.
 */
function sitemapXmlAlias() {
  return {
    name: "sitemap-xml-alias",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const out = fileURLToPath(dir);
        const childPath = path.join(out, "sitemap-0.xml");
        const aliasPath = path.join(out, "sitemap.xml");
        try {
          await access(childPath);
          const raw = await readFile(childPath, "utf8");
          const locs = [...raw.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
          if (locs.length === 0) return;
          const lastmod = new Date().toISOString().slice(0, 10);
          const body = locs
            .map(
              (loc) =>
                `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
            )
            .join("\n");
          const xml =
            `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            `${body}\n` +
            `</urlset>\n`;
          await writeFile(aliasPath, xml, "utf8");
        } catch {
          // No child sitemap yet — skip.
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
