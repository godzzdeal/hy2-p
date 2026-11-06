import { test, expect } from "@playwright/test";
import { mockPanel } from "./fixtures";
test("login has a simple password label and accessible language choice", async ({ page }) => {
  await mockPanel(page, false);
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await expect(page.getByText("Пароль администратора")).toHaveCount(0);
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});
test("keyboard selection, resets and saving produce clean ordered YAML", async ({ page }, info) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  const congestion = page.getByLabel("Контроль перегрузки", { exact: true });
  await congestion.click();
  await page.getByRole("option", { name: "reno", exact: true }).click();
  await page.getByRole("button", { name: "Сбросить Контроль перегрузки", exact: true }).click();
  const speed = page.getByLabel("Тест скорости", { exact: true });
  await speed.focus();
  await speed.press("Enter");
  await expect(page.getByRole("option", { name: "Да", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("option", { name: "По умолчанию", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Конфигурация сервера", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(page.getByText("Конфигурация сохранена.", { exact: true })).toBeVisible();
  expect(panel.saved().config).not.toContain("congestion:");
  expect(panel.saved().config).not.toContain("speedTest:");
  expect(panel.saved().config.indexOf("listen:")).toBeLessThan(panel.saved().config.indexOf("tls:"));
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    )
    .toBe(true);
  await page.screenshot({ path: info.outputPath("configuration.png"), fullPage: true });
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

test("UDP application survives reload and expired login", async ({ page }) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByLabel("Публичный UDP-порт", { exact: true }).fill("61254");
  await page.getByLabel("Адрес прослушивания Hysteria2", { exact: true }).fill(":61254");
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(
    page.getByText("Сохранённые порты: снаружи 61254, в контейнере 61254.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Применить UDP-порт", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Применение UDP-порта" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await expect(page.getByText("UDP-порт применён", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Понятно", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Применение UDP-порта" })).toHaveCount(0);
});
test("subscription title and country flag are saved together", async ({ page }, info) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Подписки", exact: true }).click();
  const title = page.getByLabel("Название подписки", { exact: true });
  await title.fill("Сервер");
  await page.getByRole("combobox", { name: "Флаг", exact: true }).click();
  await page.getByRole("option", { name: /Германия/ }).click();
  await expect(title).toHaveValue("Сервер");
  await page.getByRole("button", { name: "Сохранить настройки подписки", exact: true }).click();
  await expect.poll(() => panel.subscription().profileTitle).toBe("🇩🇪 Сервер");
  await page.screenshot({ path: info.outputPath("subscription-title.png"), fullPage: true });
});

test("users have local emoji icons and complete Unicode labels", async ({ page }, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Добавить пользователя", exact: true }).click();
  await page.getByLabel("Имя", { exact: true }).fill("Телефон");
  await page.getByRole("combobox", { name: "Эмодзи", exact: true }).click();
  await page.getByRole("option", { name: "Ракета", exact: true }).click();
  await page.getByLabel("Свой эмодзи", { exact: true }).fill("👩🏽‍💻");
  await expect(page.getByLabel("Имя", { exact: true })).toHaveValue("Телефон");
  const selectedFlag = page.getByRole("combobox", { name: "Эмодзи", exact: true }).locator("img");
  await expect(selectedFlag).toHaveAttribute("src", "/emoji/1f469-1f3fd-200d-1f4bb.svg");
  await expect
    .poll(() => selectedFlag.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Сохранить пользователя", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "Телефон" });
  await expect(row.locator("img.emoji-image")).toHaveAttribute("src", "/emoji/1f469-1f3fd-200d-1f4bb.svg");
  await expect(row.getByRole("button", { name: "Подключение 👩🏽‍💻 Телефон", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("user-emoji.png"), fullPage: true });
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
