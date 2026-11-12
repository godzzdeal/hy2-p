import { expect, test } from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";
test("announcement checkbox supports its label, keyboard and saving", async ({ page }, info) => {
  const panel = await mockPanel(page);
  await page.getByRole("link", { name: "Подписка", exact: true }).click();
  await expandSettings(page);
  await expect(page.getByRole("navigation", { name: "Блоки страницы" })).toBeHidden();
  const checkbox = page.getByRole("checkbox", { name: "Показывать объявление в подписках" });
  await expect(checkbox).not.toBeChecked();
  await page.getByText("Показывать объявление в подписках", { exact: true }).click();
  await expect(checkbox).toBeChecked();
  expect(await checkbox.evaluate((element) => getComputedStyle(element, "::before").maskImage)).toContain(
    "/check.svg",
  );
  await checkbox.focus();
  await checkbox.press("Space");
  await expect(checkbox).not.toBeChecked();
  await checkbox.press("Space");
  await expect(checkbox).toBeChecked();
  await page.getByLabel("Текст объявления", { exact: true }).fill("Технические работы завтра");
  await checkbox.focus();
  await page.screenshot({ path: info.outputPath("checkbox-checked.png") });
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect.poll(() => panel.subscription().enabled).toBe(true);
  expect(panel.subscription().text).toBe("Технические работы завтра");
});
test("subscription title keeps emoji without a separate flag selector", async ({ page }, info) => {
  const panel = await mockPanel(page);
  await page.getByRole("link", { name: "Подписка", exact: true }).click();
  await expandSettings(page);
  const title = page.getByLabel("Название подписки", { exact: true });
  await title.fill("Сервер");
  await expect(page.getByRole("combobox", { name: "Флаг", exact: true })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Общий флаг пользователей", exact: true })).toBeVisible();
  await expect(title).toHaveValue("Сервер");
  if (info.project.name === "desktop") {
    const titleBounds = await title.boundingBox();
    const emojiBounds = await page.getByRole("button", { name: "Выбрать эмодзи", exact: true }).boundingBox();
    expect(titleBounds).not.toBeNull();
    expect(emojiBounds).not.toBeNull();
    expect(Math.abs(titleBounds!.y - emojiBounds!.y)).toBeLessThanOrEqual(1);
  }
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
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect.poll(() => panel.subscription().profileTitle).toBe("🚀 Сервер");
  await page.screenshot({ path: info.outputPath("subscription-title.png"), fullPage: true });
});
