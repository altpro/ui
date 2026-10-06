import { createHash } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

// a port per checkout, so parallel worktrees never test each other's code; UI_TEST_PORT overrides it
const port = process.env.UI_TEST_PORT || String(5200 + (createHash("md5").update(process.cwd()).digest().readUInt16BE(0) % 700));

export default defineConfig({
  testDir: "tests",
  reporter: "list",
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", testMatch: ["browsers.spec.js", "workspace.spec.js", "repeater.spec.js", "recipes.spec.js"], use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", testMatch: ["browsers.spec.js", "workspace.spec.js", "repeater.spec.js", "recipes.spec.js"], use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    // a second run on the same port fails here instead of borrowing a server the first run will stop
    reuseExistingServer: false,
  },
});
