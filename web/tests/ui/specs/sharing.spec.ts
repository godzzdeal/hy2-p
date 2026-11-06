import { test, expect } from "@playwright/test";
import { mockPanel } from "../fixtures";
test("subscription title and country flag are saved together", async ({ page }, info) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Подписки", exact: true }).click();
  const title = page.getByLabel("Название подписки", { exact: true });
  await title.fill("Сервер");
  await page.getByRole("combobox", { name: "Флаг", exact: true }).click();
  await page.getByRole("option", { name: /Германия/ }).click();
  await expect(title).toHaveValue("Сервер");
  await page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).click();
  const popup = page.getByRole("dialog", { name: "Меню эмодзи", exact: true });
  await expect(popup.getByRole("gridcell").first()).toBeVisible();
  await page.screenshot({ path: info.outputPath("emoji-menu.png") });
  const bounds = await popup.boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds) {
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
  await page.getByLabel("Поиск эмодзи", { exact: true }).fill("ракета");
  await page.getByRole("gridcell", { name: "ракета", exact: true }).click();
  await expect(page.getByRole("status", { name: "Предпросмотр названия подписки" })).toContainText("Сервер");
  await expect(
    page
      .getByRole("status", { name: "Предпросмотр названия подписки" })
      .getByRole("img", { name: "🚀", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сохранить настройки подписки", exact: true }).click();
  await expect.poll(() => panel.subscription().profileTitle).toBe("🇩🇪 🚀 Сервер");
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
  await page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).click();
  await page.getByLabel("Поиск эмодзи", { exact: true }).fill("ракета");
  await page.getByRole("gridcell", { name: "ракета", exact: true }).click();
  await page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).click();
  await page.getByLabel("Поиск эмодзи", { exact: true }).fill("👩🏽‍💻");
  await expect(page.getByLabel("Имя", { exact: true })).toHaveValue("Телефон");
  const selectedFlag = page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).locator("img");
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
