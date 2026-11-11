import { expect, test } from "@playwright/test";
import { mockPanel } from "../fixtures";

test("mobile reserves the viewport for data and opens preferences on demand", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");
  await mockPanel(page);
  for (const height of [667, 844]) {
    await page.setViewportSize({ width: 390, height });
    const content = await page.locator(".content").boundingBox();
    expect(content!.height / height).toBeGreaterThan(0.7);
    const footer = await page.getByRole("contentinfo").boundingBox();
    expect(footer!.height).toBeLessThanOrEqual(64);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await page.screenshot({ path: info.outputPath("mobile-content.png") });
  await page.getByRole("button", { name: "Тема", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Выйти", exact: true })).toBeVisible();
});
