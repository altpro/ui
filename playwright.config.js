import { defineConfig, devices } from "@playwright/test";

const port = process.env.UI_TEST_PORT || "5199";

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
    reuseExistingServer: true,
  },
});
