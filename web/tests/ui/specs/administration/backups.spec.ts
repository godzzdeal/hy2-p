import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
import { WEB_SETTINGS } from "../../fixtures/data";

test("panel port derives URL and asks for restart after saving", async ({ page }, info) => {
 await mockPanel(page);
 let config = { ...WEB_SETTINGS.config };
 await page.route("**/api/admin/web", async (route) => {
  const isSave = route.request().method() === "PUT";
  if (isSave) config = route.request().postDataJSON();
  return route.fulfill({ json: { ...WEB_SETTINGS, config, restartRequired: isSave } });
 });
 await page.getByRole("link", { name: "Настройки", exact: true }).click();
 const section = page.locator("#panel-network");
 await section.getByRole("button", { name: "Настройки панели", exact: true }).click();
 await section.getByLabel("Порт веб-панели", { exact: true }).fill("9777");
 const url = section.getByLabel("Публичный URL панели и подписок", { exact: true });
 await expect(url).toHaveAttribute("readonly", "");
 await expect(url).toHaveValue(/:9777\/?$/);
 await section.getByRole("button", { name: "Сохранить настройки веб-панели" }).click();
 const dialog = page.getByRole("dialog");
 await expect(dialog).toContainText("Новый адрес панели");
 await expect(dialog.getByRole("link")).toHaveAttribute("href", /:9777\/?$/);
 await page.screenshot({ path: info.outputPath("port-confirmation.png") });
});

test("backups stay lazy and cloud actions fit the card", async ({ page }, info) => {
 await mockPanel(page);
 let calls = 0;
 await page.route("**/api/admin/backups", (route) => { calls++; return route.fulfill({ json: { destination: "disk:HY2-P", hasConfig: true } }); });
 await page.getByRole("link", { name: "Настройки", exact: true }).click();
 expect(calls).toBe(0);
 const section = page.locator("#panel-backups");
 await section.getByRole("button", { name: "Резервные копии", exact: true }).click();
 await expect(section.getByRole("button", { name: "Создать бэкап", exact: true })).toBeEnabled();
 await expect(section.getByRole("button", { name: "Отправить в облако", exact: true })).toBeEnabled();
 const bounds = (await section.boundingBox())!;
 const input = (await section.getByPlaceholder("disk:HY2-P").boundingBox())!;
 expect(input.x).toBeGreaterThanOrEqual(bounds.x + 16);
 expect(input.x + input.width).toBeLessThanOrEqual(bounds.x + bounds.width - 16);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
 await section.scrollIntoViewIfNeeded();
 await page.screenshot({ path: info.outputPath("backups.png") });
});
