import { defineConfig } from "@playwright/test";
export default defineConfig({
  webServer: { command: "bun run start:demo", url: "http://127.0.0.1:3001", reuseExistingServer: !process.env.CI, timeout: 30000 },
  testDir: ".", testMatch: "*.spec.ts", fullyParallel: true,
  workers: process.env.CI ? 4 : undefined, timeout: 30000,
  forbidOnly: !!process.env.CI, retries: 0, outputDir: "../../test-results/demo",
  use: { headless: true, screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 }, colorScheme: "light" } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true, hasTouch: true } },
  ],
});
