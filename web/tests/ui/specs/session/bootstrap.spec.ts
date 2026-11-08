import { expect, test } from "@playwright/test";
import { mockSession } from "./fixture";

test("an anonymous 401 shows login and allows signing in", async ({ page }) => {
  await mockSession(page);
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await page.getByLabel("Логин", { exact: true }).fill("admin");
  await page.getByLabel("Пароль", { exact: true }).fill("test-password-only");
  await page.getByRole("button", { name: "Войти в панель", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ваш сервер", exact: true })).toBeVisible();
});
