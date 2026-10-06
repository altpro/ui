import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

const demo = resolve(import.meta.dirname, "demo");
const pages = Object.fromEntries(
  readdirSync(demo, { recursive: true })
    .filter((f) => f.endsWith(".html"))
    .map((f) => [f.replace(".html", ""), resolve(demo, f)]),
);

export default defineConfig({
  root: demo,
  plugins: [tailwindcss(), vue()],
  // the same alias the skill tells apps to set, so demo imports read like app imports
  resolve: { alias: { "@ui": resolve(import.meta.dirname, "resources/js") } },
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: { input: pages },
  },
});
