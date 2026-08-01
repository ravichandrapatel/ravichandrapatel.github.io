// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

// User site (repo must be ravichandrapatel.github.io):
// https://ravichandrapatel.github.io/
export default defineConfig({
  site: "https://ravichandrapatel.github.io",
  base: "/",
  trailingSlash: "always",
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
