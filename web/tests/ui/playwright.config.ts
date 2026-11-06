import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "specs",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  outputDir: "../../test-results",
  reporter: "list",
  use: { headless: true, screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 }, colorScheme: "light" } },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true, hasTouch: true },
    },
  ],
});
