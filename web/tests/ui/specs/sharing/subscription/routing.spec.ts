import { expect, test } from "@playwright/test";
import { mockPanel, expandSettings } from "../../../fixtures";
import { type IAnnouncement } from "@/services/admin/announcement";

test("client direct domains can be saved, reopened and disabled", async ({ page }, info) => {
 await mockPanel(page);
 let settings: IAnnouncement = { enabled: false, text: "", updateInterval: 6 };
 await page.route("**/api/admin/announcement", async (route) => {
  if (route.request().method() === "PUT") settings = route.request().postDataJSON() as IAnnouncement;
  await route.fulfill({ json: settings });
 });
 await page.getByRole("link", { name: "Подписка", exact: true }).click();
 await expandSettings(page);
 const rules = page.getByRole("group", { name: "Маршрутизация клиентов", exact: true });
 const toggle = rules.getByRole("checkbox");
 const sites = rules.getByRole("textbox", { name: "Сайты для прямого доступа", exact: true });
 await expect(toggle).not.toBeChecked();
 await expect(sites).toBeDisabled();
 await toggle.check();
 await sites.fill("example.com\nbank.example");
 await page.getByRole("button", { name: "Сохранить", exact: true }).click();
 await expect.poll(() => settings.routing?.domains).toEqual(["example.com", "bank.example"]);
 expect(settings.routing?.enabled).toBe(true);
 await rules.scrollIntoViewIfNeeded();
 const bounds = (await rules.boundingBox())!;
 const input = (await sites.boundingBox())!;
 expect(input.x).toBeGreaterThanOrEqual(bounds.x + 16);
 expect(input.x + input.width).toBeLessThanOrEqual(bounds.x + bounds.width - 16);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
 await page.screenshot({ path: info.outputPath("client-routing.png") });
 await page.getByRole("link", { name: "Пользователи", exact: true }).click();
 await page.getByRole("link", { name: "Подписка", exact: true }).click();
 await expect(toggle).toBeChecked();
 await expect(sites).toHaveValue("example.com\nbank.example");
 await toggle.uncheck();
 await page.getByRole("button", { name: "Сохранить", exact: true }).click();
 await expect.poll(() => settings.routing?.enabled).toBe(false);
 await expect(sites).toBeDisabled();
});
