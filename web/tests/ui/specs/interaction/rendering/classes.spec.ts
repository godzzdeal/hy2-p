import { expect, test } from "@playwright/test";
import { mockPanel } from "..";
test("Next serves its own assets and native Tailwind classes", async ({ page }) => {
  await mockPanel(page);
  await expect(page.locator('script[src*="/_next/static/"]').first()).toBeAttached();
  await expect(page.locator(".content")).toHaveCSS("overflow-y", "auto");
  expect(await page.locator("body [class]").evaluateAll(elements => elements.some(element => element.classList.contains("flex")))).toBe(true);
});
