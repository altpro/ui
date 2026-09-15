import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const demo = resolve(import.meta.dirname, "demo");
const pages = Object.fromEntries(
  readdirSync(demo, { recursive: true })
    .filter((f) => f.endsWith(".html"))
    .map((f) => [f.replace(".html", ""), resolve(demo, f)]),
);

export default defineConfig({
  root: demo,
  plugins: [tailwindcss()],
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: { input: pages },
  },
});
