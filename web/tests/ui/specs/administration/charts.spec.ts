import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
import { demoSystem } from "@/services/demo/routes/system";

test("charts have numerical scales and visibility survives reload", async ({ page }, info) => {
  await mockPanel(page);
  const section = page.locator("#overview-system");
  const cpu = section.locator(".system-chart").first();
  await expect(cpu.locator(".chart-axis-values span")).toHaveText(["100%", "75%", "50%", "25%", "0%"]);
  await expect(cpu.locator(".chart-axis-time span")).toHaveCount(2);
  await expect(section.locator(".system-chart").last().locator(".chart-axis-values")).toContainText("/с");
  await section.getByRole("button", { name: "Графики", exact: true }).click();
  const preferences = page.getByRole("dialog", { name: "Видимость графиков", exact: true });
  await preferences.getByLabel("CPU", { exact: true }).uncheck();
  await expect(section.getByRole("img", { name: "CPU", exact: true })).toHaveCount(0);
  await preferences.screenshot({ path: info.outputPath("chart-preferences.png") });
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(section.getByRole("img")).toHaveCount(3);
  await expect(section.getByRole("img", { name: "CPU", exact: true })).toHaveCount(0);
});

test("hiding every chart pauses frequent system polling", async ({ page }) => {
  await mockPanel(page);
  let reads = 0;
  await page.route("**/api/system", (route) => {
    reads++;
    return route.fulfill({ json: demoSystem() });
  });
  await page.reload();
  const section = page.locator("#overview-system");
  await expect(section.getByRole("img")).toHaveCount(4);
  await section.getByRole("button", { name: "Графики", exact: true }).click();
  const preferences = page.getByRole("dialog", { name: "Видимость графиков", exact: true });
  for (const label of ["CPU", "Память", "Нагрузка", "Сеть"])
    await preferences.getByLabel(label, { exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect(section.getByRole("img")).toHaveCount(0);
  const before = reads;
  await page.waitForTimeout(5500);
  expect(reads).toBe(before);
  await expect(section.getByRole("heading", { name: "Место на диске", exact: true })).toBeVisible();
});
