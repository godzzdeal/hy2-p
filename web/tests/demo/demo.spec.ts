import { expect, test } from "@playwright/test";
import { previewDemo } from ".";
test("demo pages work without a server or API requests", async ({ page }, info) => {
  const demo = await previewDemo(page);
  await expect(page.getByRole("complementary", { name: "Демоверсия" })).toBeVisible();
  for (const title of ["Пользователи", "Подписки", "Экземпляры", "Конфигурация", "Управление HY2", "Настройки", "Обзор"]) {
    await page.locator(".app-sidebar nav").getByRole("button", { name: title, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  expect(demo.errors).toEqual([]);
  expect(demo.requests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("demo.png"), fullPage: true });
});
test("configuration edits stay in their core and resetting restores the example", async ({ page }) => {
  const demo = await previewDemo(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByLabel("Публичный адрес", { exact: true }).fill("edited.example.invalid");
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(page.getByText("Конфигурация сохранена", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Выбранный экземпляр" }).click();
  await page.getByRole("option", { name: "Запасной", exact: true }).click();
  await expect(page.getByLabel("Публичный адрес", { exact: true })).toHaveValue("vpn.example.invalid");
  await page.getByRole("combobox", { name: "Выбранный экземпляр" }).click();
  await page.getByRole("option", { name: "Основной", exact: true }).click();
  await expect(page.getByLabel("Публичный адрес", { exact: true })).toHaveValue("edited.example.invalid");
  await page.getByRole("button", { name: "Сбросить пример", exact: true }).click();
  await page.getByRole("heading", { name: "Ваш сервер", exact: true }).waitFor();
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await expect(page.getByLabel("Публичный адрес", { exact: true })).toHaveValue("vpn.example.invalid");
  expect(demo.errors).toEqual([]);
  expect(demo.requests).toEqual([]);
});
test("changes are isolated between visitors and survive navigation", async ({ browser, page }) => {
  const demo = await previewDemo(page);
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Имя", { exact: true }).fill("Тест демоверсии");
  await dialog.getByRole("button", { name: "Сохранить пользователя", exact: true }).click();
  await expect(page.getByText("Тест демоверсии", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Обзор", exact: true }).click();
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await expect(page.getByText("Тест демоверсии", { exact: true })).toBeVisible();
  const visitor = await browser.newContext();
  try {
    const other = await visitor.newPage();
    await previewDemo(other);
    await other.getByRole("button", { name: "Пользователи", exact: true }).click();
    await expect(other.getByText("Тест демоверсии", { exact: true })).toHaveCount(0);
  } finally { await visitor.close(); }
  expect(demo.errors).toEqual([]);
  expect(demo.requests).toEqual([]);
});

test("group members can be moved and the demo can be signed into again", async ({ page }) => {
  const demo = await previewDemo(page);
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Участники группы Семья", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Выбрать найденных", exact: true }).click();
  await dialog.getByRole("button", { name: "Сохранить участников", exact: true }).click();
  await expect(page.getByRole("button", { name: "Участники группы Команда", exact: true })).toHaveCount(0);
  await expect(page.locator(".user-group-toggle .user-count")).toHaveText("4");
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await page.getByLabel("Логин", { exact: true }).fill("demo");
  await page.getByLabel("Пароль", { exact: true }).fill("demo");
  await page.getByRole("button", { name: "Войти в панель", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Пользователи", level: 1, exact: true })).toBeVisible();
  expect(demo.errors).toEqual([]);
  expect(demo.requests).toEqual([]);
});
