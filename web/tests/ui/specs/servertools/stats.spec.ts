import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("runtime stats secret is fetched only on request and can be hidden", async ({ page }, info) => {
  await mockPanel(page);
  let reads = 0;
  await page.route("**/api/tools/traffic-stats", (route) => {
    reads++;
    return route.fulfill({
      json: { listen: "127.0.0.1:9999", secret: "runtime-fixture-secret", running: true },
    });
  });
  await page.getByRole("link", { name: "Конфигурация", exact: true }).click();
  await page.getByRole("button", { name: "Traffic Stats API", exact: true }).click();
  expect(reads).toBe(0);
  await page.getByRole("button", { name: "Показать", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Фактический секрет Traffic Stats", exact: true }),
  ).toHaveValue("runtime-fixture-secret");
  await page.screenshot({ path: info.outputPath("stats-tools.png"), fullPage: true });
  await page.getByRole("button", { name: "Скрыть", exact: true }).click();
  await expect(page.locator('input[value="runtime-fixture-secret"]')).toHaveCount(0);
});
