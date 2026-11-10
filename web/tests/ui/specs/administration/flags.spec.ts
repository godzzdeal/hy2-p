import { expect, test } from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";
import { type IAnnouncement } from "@/services/admin/announcement";

test("default user flag can be saved and individual names remain editable", async ({ page }, info) => {
  await mockPanel(page);
  let settings: IAnnouncement = { enabled: false, text: "", updateInterval: 6 };
  await page.route("http://panel.test/api/admin/announcement", async (route) => {
    if (route.request().method() === "PUT") settings = route.request().postDataJSON() as IAnnouncement;
    await route.fulfill({ json: settings });
  });
  await page.getByRole("button", { name: "Подписки", exact: true }).click();
  await expandSettings(page);
  const picker = page.getByRole("combobox", { name: "Общий флаг пользователей", exact: true });
  await picker.click();
  await page.getByRole("option", { name: "Нидерланды", exact: true }).click();
  await page.getByRole("button", { name: "Сохранить настройки подписки", exact: true }).click();
  await expect.poll(() => settings.defaultUserFlag).toBe("🇳🇱");
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("combobox", { name: "Флаг", exact: true })).toContainText("Общий флаг");
  await dialog.getByLabel("Имя", { exact: true }).fill("🚀 Phone");
  await dialog.screenshot({ path: info.outputPath("default-user-flag.png") });
  await dialog.getByRole("combobox", { name: "Флаг", exact: true }).click();
  await page.getByRole("option", { name: "Германия", exact: true }).click();
  await expect(dialog.getByLabel("Имя", { exact: true })).toHaveValue("🚀 Phone");
});
