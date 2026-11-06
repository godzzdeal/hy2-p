import { test, expect } from "@playwright/test";
import { mockDevices } from "./fixture";
test("device limit saves and share dialog supplies the Happ subscription", async ({ page }) => {
  const fixture = await mockDevices(page);
  await page.getByRole("button", { name: "Устройства Phone", exact: true }).click();
  await page.getByLabel("Лимит устройств", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Сохранить лимит устройств", exact: true }).click();
  await expect.poll(() => fixture.saved().limit).toBe(1);
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.getByRole("button", { name: "Подключение Phone", exact: true }).click();
  await expect(page.getByRole("button", { name: "Подключение / Happ", exact: true })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Ссылка подключения", exact: true })).toHaveValue(
    "https://panel.test/sub/fixture",
  );
  await expect(
    page.getByText(
      "Включён лимит устройств. Импортируйте подписку в Happ, чтобы получить персональный ключ устройства.",
      { exact: true },
    ),
  ).toBeVisible();
});
test("device access can be revoked and restored", async ({ page }, info) => {
  const fixture = await mockDevices(page);
  await page.getByRole("button", { name: "Устройства Phone", exact: true }).click();
  const row = page.getByRole("region", { name: "iPhone fixture", exact: true });
  await expect(row.getByText("iOS 18", { exact: true })).toBeVisible();
  await expect(row.getByText("Happ/4.12.0", { exact: true })).toBeVisible();
  await row.getByRole("button", { name: "Отключить устройство", exact: true }).click();
  await expect.poll(() => fixture.saved().devices[0]?.blocked).toBe(true);
  await expect(row.getByText("Отключено", { exact: true })).toBeVisible();
  await row.getByRole("button", { name: "Разрешить устройство", exact: true }).click();
  await expect.poll(() => fixture.saved().devices[0]?.blocked).toBe(false);
  await expect(row.getByText("В сети", { exact: true })).toBeVisible();
  await page
    .getByRole("dialog", { name: "Устройства пользователя", exact: true })
    .screenshot({ path: info.outputPath("devices.png") });
  if (info.project.name === "mobile")
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
