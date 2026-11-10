import { expect, test } from "@playwright/test";
import { chooseTheme, expandSettings, mockPanel } from "../fixtures";
const LATEST = {
  current: "v0.2.1",
  latest: "v0.5.0",
  state: "update_available",
  url: "https://github.com/godzzdeal/hy2-p/releases/tag/v0.5.0",
  publishedAt: "2026-11-06T00:00:00Z",
  checkedAt: "2026-11-06T01:00:00Z",
};
test("expanded settings keep hidden selects inside the content and footer at the viewport edge", async ({ page }, info) => {
  if (info.project.name === "desktop") await page.setViewportSize({ width: 1024, height: 800 });
  await mockPanel(page);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  const footer = page.getByRole("contentinfo");
  const initial = (await footer.boundingBox())!;
  await expect(page.locator('.content select[aria-hidden="true"]').first()).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.locator(".content").evaluate(element => element.scrollTo(0, element.scrollHeight));
  await page.mouse.move(initial.x + initial.width / 2, initial.y + initial.height / 2);
  await page.mouse.wheel(0, 1600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const bounds = (await footer.boundingBox())!;
  expect(bounds.y).toBe(initial.y);
  expect(Math.abs(bounds.y + bounds.height - page.viewportSize()!.height)).toBeLessThanOrEqual(1);
  expect(await page.locator(".content").evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath("footer-scroll.png") });
});
test("the branded footer fits both themes and links to the project and author", async ({ page }, info) => {
  await mockPanel(page);
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("HY2-P");
  await expect(footer.getByRole("link", { name: "godzzdeal", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/godzzdeal",
  );
  await expect(footer.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/godzzdeal/hy2-p",
  );
  await expect(footer).toContainText("Установлена последняя версия");
  for (const choice of [
    { label: "Тёмная", value: "dark" },
    { label: "Светлая", value: "light" },
  ]) {
    await chooseTheme(page, choice);
    const bounds = await footer.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(await footer.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await footer.screenshot({ path: info.outputPath("footer-" + choice.value + ".png") });
  }
});
test("manual checks show pending feedback and the new release link", async ({ page }) => {
  await mockPanel(page);
  await expect(page.getByRole("contentinfo")).toContainText("Установлена последняя версия");
  let finishCheck = () => {};
  const pending = new Promise<void>((resolve) => {
    finishCheck = resolve;
  });
  await page.route("http://panel.test/api/panel/update", async (route) => {
    await pending;
    await route.fulfill({ json: LATEST });
  });
  const check = page.getByRole("button", { name: "Проверить обновления панели", exact: true });
  await check.click();
  await expect(check).toBeDisabled();
  await expect(page.getByRole("contentinfo")).toContainText("Проверяем обновления…");
  finishCheck();
  await expect(page.getByRole("link", { name: "Доступна версия v0.5.0" })).toHaveAttribute(
    "href",
    LATEST.url,
  );
  await expect(check).toBeEnabled();
});
test("a failed release check stays local and can be retried", async ({ page }) => {
  await mockPanel(page);
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Установлена последняя версия");
  await page.route("http://panel.test/api/panel/update", (route) =>
    route.fulfill({ status: 502, json: { error: "GitHub unavailable" } }),
  );
  const check = page.getByRole("button", { name: "Проверить обновления панели", exact: true });
  await check.click();
  await expect(footer).toContainText("Не удалось проверить обновления");
  await expect(page.getByRole("heading", { name: "Ваш сервер", exact: true })).toBeVisible();
  await page.unroute("http://panel.test/api/panel/update");
  await check.click();
  await expect(footer).toContainText("Установлена последняя версия");
});
test("development builds are not presented as an available update", async ({ page }) => {
  await mockPanel(page);
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Установлена последняя версия");
  await page.route("http://panel.test/api/panel/update", (route) =>
    route.fulfill({ json: { ...LATEST, state: "ahead" } }),
  );
  await page.getByRole("button", { name: "Проверить обновления панели", exact: true }).click();
  await expect(footer).toContainText("Новее последнего релиза");
  await expect(footer.getByRole("link", { name: /Доступна версия/ })).toHaveCount(0);
});
