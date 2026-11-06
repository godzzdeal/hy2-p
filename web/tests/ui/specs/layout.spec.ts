import { test, expect } from "@playwright/test";
import { mockPanel } from "../fixtures";
test("quick-start content and navigation stay inside their bounds", async ({ page }, info) => {
  await mockPanel(page);
  const step = page.locator(".steps .step").first();
  await step.hover();
  const bounds = await step.boundingBox();
  const number = await step.locator(".step-number").boundingBox();
  expect(number!.x - bounds!.x).toBeGreaterThanOrEqual(8);
  expect(number!.y - bounds!.y).toBeGreaterThanOrEqual(8);
  expect(bounds!.y + bounds!.height - number!.y - number!.height).toBeGreaterThanOrEqual(8);
  const logo = await page.locator(".brand").boundingBox();
  const header = await page.locator(".app-header").boundingBox();
  const logout = await page.getByRole("button", { name: "Выйти", exact: true }).boundingBox();
  if (info.project.name === "desktop") {
    expect(logo!.height).toBe(header!.height);
    const item = await page.getByRole("button", { name: "Обзор", exact: true }).boundingBox();
    expect(logout!.x).toBe(item!.x);
    expect(logout!.width).toBe(item!.width);
  } else {
    expect(logout!.y).toBeGreaterThanOrEqual(logo!.y);
    expect(logout!.y + logout!.height).toBeLessThanOrEqual(logo!.y + logo!.height);
  }
  await page.screenshot({ path: info.outputPath("navigation-spacing.png"), fullPage: true });
});
