import { expect, test } from "@playwright/test";
import { chooseTheme, expandSettings } from "../../fixtures";
import { expectAligned, expectInside, mockDesign } from "./fixture";

test("new toolbars align controls and the footer keeps its PWA label", async ({ page }, info) => {
  await mockDesign(page);
  for (const choice of [
    { label: "Светлая", value: "light" },
    { label: "Тёмная", value: "dark" },
  ]) {
    await chooseTheme(page, choice);
    const heading = page.locator(".system-heading");
    await expectAligned(
      heading.locator("small"),
      heading.getByRole("button", { name: "Графики", exact: true }),
    );
    await page.getByRole("button", { name: "Настройки", exact: true }).click();
    await expandSettings(page);
    const panel = page.locator(".panel-maintenance");
    const row = panel.locator(".row-actions").first();
    const version = row.locator("span").first();
    const check = row.getByRole("button");
    await expect(version).toContainText("0.8.0");
    if (info.project.name === "desktop") await expectAligned(version, check);
    await expectInside(panel);
    const control = panel.getByRole("combobox");
    expect((await control.boundingBox())!.height).toBe((await check.boundingBox())!.height);
    expect(
      await control.evaluate((element) => parseFloat(getComputedStyle(element).borderTopWidth)),
    ).toBeGreaterThanOrEqual(2);
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("button", { name: "Установить панель", exact: true })).toHaveText("PWA");
    await expectInside(footer);
    await panel.screenshot({ path: info.outputPath("maintenance-" + choice.value + ".png") });
    await page.getByRole("button", { name: "Обзор", exact: true }).click();
  }
});

test("all pages keep expanded content inside the viewport in both themes", async ({ page }, info) => {
  await mockDesign(page);
  for (const choice of [
    { label: "Светлая", value: "light" },
    { label: "Тёмная", value: "dark" },
  ]) {
    await chooseTheme(page, choice);
    for (const title of [
      "Обзор",
      "Пользователи",
      "Подписки",
      "Экземпляры",
      "Конфигурация",
      "Управление HY2",
      "Настройки",
    ]) {
      await page.locator(".app-sidebar nav").getByRole("button", { name: title, exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (title === "Настройки" || title === "Подписки") await expandSettings(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expectInside(page.locator(".content"));
      await expectInside(page.getByRole("contentinfo"));
      await page.screenshot({ path: info.outputPath(choice.value + "-" + title + ".png") });
    }
  }
});
