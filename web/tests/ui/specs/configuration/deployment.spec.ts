import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("UDP application survives reload and expired login", async ({ page }) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByLabel("Публичный UDP-порт", { exact: true }).fill("61254");
  await page.getByLabel("listen", { exact: true }).fill(":61254");
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(
    page.getByText("Сохранённые порты: снаружи 61254, в контейнере 61254.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Применить UDP-порт", exact: true }).click();
  await expect(page.getByText("Применяем и проверяем UDP-порт", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await expect(page.locator(".notification").getByText("UDP-порт применён.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Закрыть уведомление", exact: true }).click();
  await expect(page.locator(".port-operation")).toHaveCount(0);
});
