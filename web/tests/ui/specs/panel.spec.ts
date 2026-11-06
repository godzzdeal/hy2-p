import { test, expect } from "@playwright/test";
import { mockPanel, chooseTheme } from "../fixtures";
test("login has a simple password label and accessible language choice", async ({ page }) => {
  await mockPanel(page, false);
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await expect(page.getByText("Пароль администратора")).toHaveCount(0);
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("logs support Unicode, search, level filters, pause and clearing", async ({ page }, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Ядро и журнал", exact: true }).click();
  const region = page.getByRole("region", { name: "Сообщения ядра" });
  await expect(region).toContainText("Сертификат обновлён ✓");
  await page.getByRole("searchbox", { name: "Поиск в журнале" }).fill("ACME");
  await expect(region).not.toContainText("Сертификат обновлён");
  await expect(region).toContainText("проверка домена");
  await page.getByRole("combobox", { name: "Уровень сообщений" }).click();
  await page.getByRole("option", { name: "Ошибки", exact: true }).click();
  const follow = page.getByRole("button", { name: "Автопрокрутка", exact: true });
  await follow.click();
  await expect(follow).toHaveAttribute("aria-pressed", "false");
  await page.screenshot({ path: info.outputPath("logs.png"), fullPage: true });
  await page.getByRole("button", { name: "Очистить", exact: true }).click();
  await expect(region).toContainText("Пока нет записей");
});

test("the panel displays the server build version", async ({ page }) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect(page.getByRole("status", { name: "Версия панели" }).last()).toHaveText("v0.2.1");
  await expect(page.getByRole("status", { name: "Версия панели" }).last()).toHaveAttribute(
    "title",
    "Сборка: test-build",
  );
});

test("pixel themes and the emoji menu work with keyboard navigation", async ({ page }, info) => {
  await mockPanel(page);
  const backgrounds: string[] = [];
  for (const choice of [
    { label: "Тёмная", value: "dark" },
    { label: "Светлая", value: "light" },
  ]) {
    await chooseTheme(page, choice);
    backgrounds.push(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
    await page.screenshot({ path: info.outputPath("pixel-" + choice.value + ".png"), fullPage: true });
  }
  expect(backgrounds[0]).not.toBe(backgrounds[1]);
  expect(await page.evaluate(() => document.fonts.check('18px "Pixelify Sans"'))).toBe(true);
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Добавить пользователя", exact: true }).click();
  await page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).click();
  await page.getByLabel("Поиск эмодзи", { exact: true }).fill("ракета");
  await page.getByRole("gridcell", { name: "ракета", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Поиск эмодзи", { exact: true })).toHaveValue("");
  await expect(page.getByRole("dialog", { name: "Меню эмодзи", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Меню эмодзи", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Новый пользователь", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).click();
  await page.getByLabel("Поиск эмодзи", { exact: true }).fill("ракета");
  await page.getByRole("gridcell", { name: "ракета", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).locator("img"),
  ).toHaveAttribute("src", "/emoji/1f680.svg");
});
