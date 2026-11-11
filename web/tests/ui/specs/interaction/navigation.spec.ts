import { expect, test } from "@playwright/test";
import { mockPanel, waitForAppearance } from "../../fixtures";
import { mockUsers } from ".";

test("theme cycles on click, persists and aligns with language and current user",async({page},info)=>{
 await mockPanel(page);
 await waitForAppearance(page);
 const theme=page.getByRole("button",{name:"Тема",exact:true});
 const language=page.getByRole("button",{name:"Язык",exact:true});
 const themeBox=(await theme.boundingBox())!,languageBox=(await language.boundingBox())!;
 expect(themeBox.height).toBe(languageBox.height);expect(themeBox.y).toBe(languageBox.y);
 if(info.project.name==="mobile") {
  const logoutBox=(await page.getByRole("button",{name:"Выйти",exact:true}).boundingBox())!;
  expect(logoutBox.y).toBe(themeBox.y);expect(logoutBox.height).toBe(themeBox.height);
  expect(logoutBox.x).toBeGreaterThan(languageBox.x+languageBox.width);
 }
 await expect(theme).toHaveAttribute("data-theme-mode","system");
 await theme.focus();await page.keyboard.press("Enter");
 await expect(theme).toHaveAttribute("data-theme-mode","light");
 await expect(page.locator("html")).toHaveAttribute("data-theme","light");
 await theme.click();
 await expect(page.getByRole("menu")).toHaveCount(0);
 await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 await page.reload();await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 await expect(theme).toHaveAttribute("data-theme-mode","dark");
 await theme.click();await expect(theme).toHaveAttribute("data-theme-mode","system");
 if(info.project.name==="desktop") {
  const account=page.locator(".current-user");
  await expect(account).toContainText("admin");
  const accountBox=(await account.boundingBox())!;
  const controlsBox=(await page.locator(".appearance-controls").boundingBox())!;
  expect(accountBox.x).toBeGreaterThan(controlsBox.x+controlsBox.width);
  expect(accountBox.height).toBe(themeBox.height);
  expect(accountBox.y).toBe(themeBox.y);
 }
 await language.click();await expect(page.getByRole("menuitemradio",{name:"Русский",exact:true})).toHaveAttribute("aria-checked","true");
 await page.screenshot({path:info.outputPath("appearance-menus.png")});
 await page.keyboard.press("Escape");
});

test("large user counts fit normal collapsed and mobile navigation", async ({ page }, info) => {
  for (const count of [99, 100, 9999]) {
    await mockUsers(page, count);
    const counter = page.locator(".app-sidebar .user-count");
    await expect(counter).toHaveText(count > 99 ? "99+" : String(count));
    await expect(counter).toHaveAttribute("title", "Всего пользователей: " + count);
    if (info.project.name === "desktop") await page.getByRole("button", { name: "Свернуть меню", exact: true }).click();
    const button = page.locator(".app-sidebar nav").getByRole("link", { name: "Пользователи", exact: true });
    const bounds = (await button.boundingBox())!;
    const badge = (await counter.boundingBox())!;
    expect(badge.x).toBeGreaterThanOrEqual(bounds.x);
    expect(badge.x + badge.width).toBeLessThanOrEqual(bounds.x + bounds.width);
    expect(await counter.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (info.project.name === "desktop") await page.getByRole("button", { name: "Развернуть меню", exact: true }).click();
  }
});

test("collapsed desktop sidebar keeps icons, hides captions and restores mobile navigation", async ({page}, info) => {
 test.skip(info.project.name !== "desktop");
 await mockPanel(page);
 await page.getByRole("button", {name:"Свернуть меню", exact:true}).click();
 const sidebar = page.locator(".app-sidebar");
 await expect(page.locator(".sidebar-collapsed")).toBeVisible();
 for (const link of await sidebar.locator("nav a").all()) {
  await expect(link.locator(".nav-item-label")).toBeHidden();
  await expect(link.locator("svg")).toBeVisible();
  const icon = (await link.locator("svg").boundingBox())!;
  const row = (await link.boundingBox())!;
  expect(icon.width).toBe(24);
  expect(Math.abs(icon.x + icon.width / 2 - row.x - row.width / 2)).toBeLessThanOrEqual(1);
 }
 await expect(sidebar.locator(".logout-label")).toBeHidden();
 expect(await sidebar.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
 await page.screenshot({path:info.outputPath("sidebar-collapsed.png")});
 await page.reload();
 await expect(sidebar.locator(".nav-item-label").first()).toBeHidden();
 await page.setViewportSize({width:390,height:844});
 await expect(sidebar.locator(".nav-item-label").first()).toBeVisible();
 await page.setViewportSize({width:1440,height:1000});
 await page.getByRole("button", {name:"Развернуть меню",exact:true}).click();
 await expect(sidebar.locator(".nav-item-label").first()).toBeVisible();
});

test("traffic labels have padding and mobile action titles render flags and emoji", async ({ page }, info) => {
  await mockUsers(page, 1);
  await page.route("**/api/traffic", (route) => route.fulfill({ json: {
    available: true, updated: "2026-11-10T12:00:00Z", error: "",
    users: { "0000000000000000": { upload: 0, download: 1.13 * 1024 ** 3, limit: 20 * 1024 ** 3, online: 0, lastSeen: "" } },
  } }));
  await page.getByRole("link", { name: "Пользователи", exact: true }).click();
  const status = page.locator(".traffic-status");
  await expect(status).toContainText("Статистика:");
  expect(await status.evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft))).toBeGreaterThanOrEqual(16);
  await expect(page.locator(".usage-cell strong")).toHaveText("1,13/20 ГБ");
  await expect(page.locator(".usage-cell small")).toHaveCount(0);
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Действия 🇳🇱 🚀 Phone 0", exact: true }).click();
    const title = page.locator(".user-action-title");
    await expect(title.locator(".country-flag")).toHaveAttribute("src", /\/flags\/nl\.svg$/);
    await expect(title.locator(".emoji-image")).toHaveAttribute("src", "/emoji/1f680.svg");
    expect(await title.locator(".country-flag").evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    await page.locator(".user-action-popup").screenshot({ path: info.outputPath("flagged-actions.png") });
  }
});
