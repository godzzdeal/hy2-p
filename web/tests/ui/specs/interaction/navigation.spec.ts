import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
import { mockUsers } from ".";

test("three theme icons support the keyboard and align with the language control", async ({ page }, info) => {
  await mockPanel(page);
  const themes = page.getByRole("group", { name: "Тема", exact: true });
  await expect(themes.getByRole("button")).toHaveCount(3);
  for (const [label, value] of [["Светлая", "light"], ["Тёмная", "dark"], ["Системная", "system"]]) {
    const button = themes.getByRole("button", { name: label, exact: true });
    await button.focus();
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(themes.locator('[aria-pressed="true"]')).toHaveCount(1);
    if (value === "system") await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    else await expect(page.locator("html")).toHaveAttribute("data-theme", value);
  }
  const language = (await page.locator(".language-control").getByRole("combobox").boundingBox())!;
  const theme = (await themes.getByRole("button").first().boundingBox())!;
  expect(theme.height).toBe(language.height);
  if (info.project.name === "mobile") expect(theme.y).toBe(language.y);
  await page.locator(".aside-bottom").screenshot({ path: info.outputPath("theme-switch.png") });
});

test("large user counts fit normal collapsed and mobile navigation", async ({ page }, info) => {
  for (const count of [99, 100, 9999]) {
    await mockUsers(page, count);
    const counter = page.locator(".app-sidebar .user-count");
    await expect(counter).toHaveText(count > 99 ? "99+" : String(count));
    await expect(counter).toHaveAttribute("title", "Всего пользователей: " + count);
    if (info.project.name === "desktop") await page.getByRole("button", { name: "Свернуть меню", exact: true }).click();
    const button = page.locator(".app-sidebar nav").getByRole("button", { name: "Пользователи", exact: true });
    const bounds = (await button.boundingBox())!;
    const badge = (await counter.boundingBox())!;
    expect(badge.x).toBeGreaterThanOrEqual(bounds.x);
    expect(badge.x + badge.width).toBeLessThanOrEqual(bounds.x + bounds.width);
    expect(await counter.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (info.project.name === "desktop") await page.getByRole("button", { name: "Развернуть меню", exact: true }).click();
  }
});

test("traffic labels have padding and mobile action titles render flags and emoji", async ({ page }, info) => {
  await mockUsers(page, 1);
  await page.route("http://panel.test/api/traffic", (route) => route.fulfill({ json: {
    available: true, updated: "2026-11-10T12:00:00Z", error: "",
    users: { "0000000000000000": { upload: 0, download: 1.13 * 1024 ** 3, limit: 20 * 1024 ** 3, online: 0, lastSeen: "" } },
  } }));
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  const status = page.locator(".traffic-status");
  await expect(status).toContainText("Статистика:");
  expect(await status.evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft))).toBeGreaterThanOrEqual(16);
  await expect(page.locator(".usage-cell strong")).toHaveText("1,13/20 ГБ");
  await expect(page.locator(".usage-cell small")).toHaveCount(0);
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Действия 🇳🇱 🚀 Phone 0", exact: true }).click();
    const title = page.locator(".user-action-title");
    await expect(title.locator(".country-flag")).toHaveAttribute("src", "/flags/nl.svg");
    await expect(title.locator(".emoji-image")).toHaveAttribute("src", "/emoji/1f680.svg");
    expect(await title.locator(".country-flag").evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    await page.locator(".user-action-popup").screenshot({ path: info.outputPath("flagged-actions.png") });
  }
});
