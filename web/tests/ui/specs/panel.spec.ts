import { test, expect } from "@playwright/test";
import { mockPanel, chooseTheme } from "../fixtures";
test("phone installation metadata and manual steps are available", async ({ page }) => {
  await mockPanel(page);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  const manifest = await page.evaluate(async () => {
    const response = await fetch("/manifest.webmanifest");
    return response.json() as Promise<{ display: string; icons: { src: string; sizes: string }[] }>;
  });
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((icon) => icon.sizes)).toContain("192x192");
  expect(manifest.icons.map((icon) => icon.sizes)).toContain("512x512");
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await page.getByRole("button", { name: "Установить панель", exact: true }).click();
  const help = page.getByRole("dialog", { name: "Панель на главном экране", exact: true });
  await expect(help).toContainText("Safari");
  await expect(help).toContainText("Android");
});
test("the install button uses the browser prompt and installed event", async ({ page }) => {
  await mockPanel(page);
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperty(event, "prompt", {
      value: async () => {
        document.documentElement.dataset.installPromptCalled = "true";
        return { outcome: "accepted", platform: "web" };
      },
    });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await page.getByRole("button", { name: "Установить панель", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-install-prompt-called", "true");
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.getByText("Панель уже установлена", { exact: true })).toBeVisible();
});
test("login has a simple password label and accessible language choice", async ({ page }, info) => {
  await mockPanel(page, false);
  await expect(page.getByRole("heading", { name: "HY2-P", exact: true })).toBeVisible();
  await expect(page.getByText("Вход в панель", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Центр управления", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await expect(page.getByText("Пароль администратора")).toHaveCount(0);
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("login.png"), fullPage: true });
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
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain("Epilepsy Sans");
  for (const sample of ["Настройки сервера Ёжик", "Server settings 0123456789"]) {
    expect(await page.evaluate((text) => document.fonts.check('26px "Epilepsy Sans"', text), sample)).toBe(
      true,
    );
  }
  await page.getByRole("button", { name: "Подписки", exact: true }).click();
  await page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).click();
  await page.getByLabel("Поиск эмодзи", { exact: true }).fill("ракета");
  await page.getByRole("gridcell", { name: "ракета", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Поиск эмодзи", { exact: true })).toHaveValue("");
  await expect(page.getByRole("dialog", { name: "Меню эмодзи", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Меню эмодзи", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Название подписки", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).click();
  await page.getByLabel("Поиск эмодзи", { exact: true }).fill("ракета");
  await page.getByRole("gridcell", { name: "ракета", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).locator("img"),
  ).toHaveAttribute("src", "/emoji/1f680.svg");
});
