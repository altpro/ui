import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  reporter: "list",
  use: { baseURL: "http://localhost:5199" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", testMatch: ["browsers.spec.js", "order.spec.js"], use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", testMatch: ["browsers.spec.js", "order.spec.js"], use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npx vite --port 5199 --strictPort",
    url: "http://localhost:5199",
    reuseExistingServer: true,
  },
});
