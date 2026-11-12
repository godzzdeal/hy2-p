import { expect, test, type Page } from "@playwright/test";
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

async function verifyProviderHelp(page: Page, name: string, url: string, detail: string, screenshot: string) {
 const form = page.getByRole("dialog", { name: "Хранилище", exact: true });
 await form.getByRole("combobox").click();
 await page.getByRole("option", { name, exact: true }).click();
 await expect(form.getByRole("link", { name: "Получить ключи", exact: true })).toHaveAttribute("href", url);
 await form.getByRole("button", { name: "Как получить Client ID и Client Secret", exact: true }).click();
 const help = page.getByRole("dialog", { name: "Как получить Client ID и Client Secret", exact: true });
 await expect(help).toBeVisible();
 await expect(help).toHaveCSS("opacity", "1");
 await expect(help).toContainText(detail);
 await expect(help.getByRole("link", { name: "Документация сервиса", exact: true })).toHaveAttribute("target", "_blank");
 const bounds = (await help.boundingBox())!;
 const viewport = page.viewportSize()!;
 expect(bounds.x).toBeGreaterThanOrEqual(12);
 expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width - 12);
 expect(bounds.y).toBeGreaterThanOrEqual(12);
 expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - 12);
 await page.screenshot({ path: screenshot });
 await help.getByRole("button", { name: "Закрыть подсказку", exact: true }).click();
}

test("storage key help follows the selected provider and fits the viewport", async ({ page }, info) => {
 await mockPanel(page);
 await page.route("**/api/admin/backups/storages", (route) => route.fulfill({ json: route.request().method() === "GET" ? { accounts: [] } : { providers: [] } }));
 await page.getByRole("link", { name: "Настройки", exact: true }).click();
 const section = page.locator("#panel-backups");
 await section.getByRole("button", { name: "Резервные копии", exact: true }).click();
 await section.getByRole("button", { name: "Подключить", exact: true }).click();
 for (const [name, url, detail] of [
  ["Яндекс Диск", "https://oauth.yandex.ru/", "Для авторизации пользователей"],
  ["Google Drive", "https://console.cloud.google.com/auth/clients", "Web application"],
  ["Dropbox", "https://www.dropbox.com/developers/apps", "App key"],
  ["OneDrive", "https://entra.microsoft.com/", "не Secret ID"],
 ]) await verifyProviderHelp(page, name, url, detail, info.outputPath(name + "-help.png"));
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("backups stay lazy and cloud actions fit the card", async ({ page }, info) => {
 await mockPanel(page);
 let calls = 0;
 await page.route("**/api/admin/backups/storages", (route) => { calls++; return route.fulfill({ json: { accounts: [{ id: "a".repeat(32), name: "Резервные копии", provider: "yandex", folder: "HY2-P" }] } }); });
 await page.getByRole("link", { name: "Настройки", exact: true }).click();
 expect(calls).toBe(0);
 const section = page.locator("#panel-backups");
 await section.getByRole("button", { name: "Резервные копии", exact: true }).click();
 await expect(section.getByRole("button", { name: "Создать бэкап", exact: true })).toBeEnabled();
 await expect(section.getByRole("button", { name: "Отправить бэкап", exact: true })).toBeEnabled();
 const bounds = (await section.boundingBox())!;
 const input = (await section.getByRole("button", { name: "Отправить бэкап", exact: true }).boundingBox())!;
 expect(input.x).toBeGreaterThanOrEqual(bounds.x + 16);
 expect(input.x + input.width).toBeLessThanOrEqual(bounds.x + bounds.width - 16);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
 await section.scrollIntoViewIfNeeded();
 await page.screenshot({ path: info.outputPath("backups.png") });
});
