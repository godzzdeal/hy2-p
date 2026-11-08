import { expect, test } from "@playwright/test";
import { mockSession } from "./fixture";

test("an expired session returns to login and can authenticate again", async ({ page }) => {
  const session = await mockSession(page, true);
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await expect(
    page.getByText("Добавьте первого пользователя для получения ссылки подключения."),
  ).toBeVisible();
  await page.route("http://panel.test/api/users", async (route) => {
    session.expire();
    await route.fulfill({ status: 401, json: { error: "Сессия завершена" } });
    await page.unroute("http://panel.test/api/users");
  });
  await page.getByRole("button", { name: "Обновить", exact: true }).click();
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await page.getByLabel("Логин", { exact: true }).fill("admin");
  await page.getByLabel("Пароль", { exact: true }).fill("test-password-only");
  await page.getByRole("button", { name: "Войти в панель", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Пользователи", exact: true, level: 1 })).toBeVisible();
});

test("logging out does not leave session observers waiting", async ({ page }) => {
  await mockSession(page, true);
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
});

test("changing credentials returns to login without hanging", async ({ page }) => {
  const session = await mockSession(page, true);
  await page.route("http://panel.test/api/admin/account", async (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    session.expire();
    await route.fulfill({ json: { username: "owner", loginRequired: true } });
  });
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await page.getByLabel("Логин", { exact: true }).fill("owner");
  await page.getByLabel("Текущий пароль", { exact: true }).fill("test-password-only");
  await page.getByRole("button", { name: "Изменить данные входа", exact: true }).click();
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Логин", { exact: true })).toHaveValue("owner");
});
