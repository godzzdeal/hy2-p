import { expect, test } from "@playwright/test";
import { mockPanel } from "../fixtures";
test("sidebar collapse is saved and mobile keeps horizontal navigation", async ({ page }, info) => {
  await mockPanel(page);
  const toggle = page.getByRole("button", { name: "Свернуть меню", exact: true });
  if (info.project.name === "mobile") {
    await expect(toggle).toBeHidden();
    return;
  }
  const before = await page.locator("main").boundingBox();
  await toggle.click();
  const collapsed = await page.locator("main").boundingBox();
  expect(collapsed!.width).toBeGreaterThan(before!.width);
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Пользователи", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Развернуть меню", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("collapsed-sidebar.png") });
  await page.getByRole("button", { name: "Развернуть меню", exact: true }).click();
  await expect(page.locator(".nav-item-label").first()).toBeVisible();
});
test("quick-start content and navigation stay inside their bounds", async ({ page }, info) => {
  await mockPanel(page);
  const step = page.locator(".steps .step").first();
  await step.hover();
  const bounds = await step.boundingBox();
  const number = await step.locator(".step-number").boundingBox();
  expect(number!.x - bounds!.x).toBeGreaterThanOrEqual(8);
  expect(number!.y - bounds!.y).toBeGreaterThanOrEqual(8);
  expect(bounds!.y + bounds!.height - number!.y - number!.height).toBeGreaterThanOrEqual(8);
  const logo = await page.locator(".brand").boundingBox();
  const header = await page.locator(".app-header").boundingBox();
  const logout = await page.getByRole("button", { name: "Выйти", exact: true }).boundingBox();
  if (info.project.name === "desktop") {
    expect(logo!.height).toBe(header!.height);
    const item = await page.getByRole("button", { name: "Обзор", exact: true }).boundingBox();
    expect(logout!.x).toBe(item!.x);
    expect(logout!.width).toBe(item!.width);
  } else {
    expect(logout!.y).toBeGreaterThanOrEqual(logo!.y);
    expect(logout!.y + logout!.height).toBeLessThanOrEqual(logo!.y + logo!.height);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const menu = page.locator(".app-sidebar > nav");
      expect(await menu.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
      expect(await menu.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
      const first = await menu.getByRole("button").first().boundingBox();
      for (const button of await menu.getByRole("button").all()) {
        const item = await button.boundingBox();
        expect(item!.y).toBe(first!.y);
        expect(item!.height).toBe(first!.height);
        expect(
          await button.evaluate(
            (element) =>
              element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight,
          ),
        ).toBe(true);
      }
      await menu.getByRole("button").last().focus();
      const last = await menu.getByRole("button").last().boundingBox();
      const menuBounds = await menu.boundingBox();
      expect(last!.x).toBeGreaterThanOrEqual(menuBounds!.x);
      // Scroll offsets round to whole pixels; text widths can remain fractional.
      expect(last!.x + last!.width).toBeLessThanOrEqual(menuBounds!.x + menuBounds!.width + 1);
      expect(
        await menu.evaluate((element) => {
          element.scrollTop = 100;
          return element.scrollTop;
        }),
      ).toBe(0);
      await menu.getByRole("button").first().focus();
    }
  }
  await page.screenshot({ path: info.outputPath("navigation-spacing.png"), fullPage: true });
});

test("page forms share padding and content stays inside the viewport", async ({ page }, info) => {
  await mockPanel(page);
  for (const title of ["Обзор", "Пользователи", "Подписки", "Ядра", "Конфигурация", "Ядро и журнал", "Настройки"]) {
    await page.locator(".app-sidebar nav").getByRole("button", { name: title, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (title === "Настройки") await expect(page.locator("#cloud-password input").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    const forms = await page.locator(".form-body").evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element);
      return { left: parseFloat(style.paddingLeft), right: parseFloat(style.paddingRight), top: parseFloat(style.paddingTop), bottom: parseFloat(style.paddingBottom) };
    }));
    for (const padding of forms) {
      expect(Math.min(padding.left, padding.right, padding.top, padding.bottom)).toBeGreaterThanOrEqual(16);
    }
    await page.screenshot({ path: info.outputPath("page-" + title + ".png"), fullPage: true });
  }
});

test("motion is short and respects the reduced-motion preference", async ({ page }) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Добавить пользователя", exact: true }).click();
  const dialog = page.getByRole("dialog");
  expect(await dialog.evaluate(element => getComputedStyle(element).animationDuration)).toBe("0.2s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await dialog.evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  expect(await page.locator("html").evaluate(element => getComputedStyle(element).scrollBehavior)).toBe("auto");
});
