import { expect, test } from "@playwright/test";
import { chooseUserAction } from "../../fixtures";
import { mockDevices } from "./fixture";
test("device load failure can be retried without exposing a save form", async ({ page }) => {
  await mockDevices(page);
  let hasFailed = true;
  await page.route("http://panel.test/api/users/test-user/devices", async (route) => {
    if (hasFailed) return route.fulfill({ status: 503, json: { error: "Устройства временно недоступны" } });
    return route.fallback();
  });
  await chooseUserAction(page, "Phone", "Устройства");
  await expect(page.getByRole("alert")).toContainText("Устройства временно недоступны");
  await expect(page.getByRole("button", { name: "Сохранить лимит устройств", exact: true })).toHaveCount(0);
  hasFailed = false;
  await page.getByRole("button", { name: "Повторить", exact: true }).click();
  await expect(page.getByLabel("Лимит устройств", { exact: true })).toHaveValue("0");
});
test("an empty device list explains how devices are discovered", async ({ page }) => {
  const fixture = await mockDevices(page);
  fixture.set({ limit: 0, devices: [] });
  await chooseUserAction(page, "Phone", "Устройства");
  await expect(
    page.getByText("Устройства появятся после обновления подписки в Happ.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Модель и ОС сообщает приложение. Статус подключения обновляется автоматически.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("a device record can be forgotten explicitly", async ({ page }) => {
  const fixture = await mockDevices(page);
  await chooseUserAction(page, "Phone", "Устройства");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Удалить запись устройства", exact: true }).click();
  await expect.poll(() => fixture.saved().devices.length).toBe(0);
  await expect(page.getByRole("region", { name: "iPhone fixture", exact: true })).toHaveCount(0);
});
