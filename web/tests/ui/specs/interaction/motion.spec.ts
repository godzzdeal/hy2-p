import { expect, test } from "@playwright/test";
import { chooseTheme, mockPanel } from "../../fixtures";
import { expectHover } from ".";

test("wheel scrolling follows each movement without snapping across sections", async ({ page }) => {
  await mockPanel(page);
  const content = page.locator(".content");
  await expect(page.locator(".system-chart")).toHaveCount(4);
  expect(await content.evaluate((element) => getComputedStyle(element).scrollSnapType)).toBe("none");
  const box = (await content.boundingBox())!;
  await content.evaluate((element) => element.scrollTo({ top: 0, behavior: "instant" }));
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (const [delta, expected] of [[96, 96], [96, 192], [-64, 128]]) {
    await page.mouse.wheel(0, delta);
    await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBe(expected);
  }
});

test("long select lists scroll and highlight without moving under the pointer", async ({ page }, info) => {
  await mockPanel(page);
  for (const theme of [{ label: "Светлая", value: "light" }, { label: "Тёмная", value: "dark" }]) {
    await chooseTheme(page, theme);
    await page.getByRole("button", { name: "Пользователи", exact: true }).click();
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await page.getByRole("combobox", { name: "Флаг", exact: true }).click();
    const popup = page.locator(".select-popup");
    const viewport = popup.locator("[data-radix-select-viewport]");
    const position = (await popup.boundingBox())!;
    await expectHover(page, popup.getByRole("option").nth(1));
    await viewport.hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const visible = await popup.getByRole("option").evaluateAll((elements) => {
      const bounds = elements[0].closest("[data-radix-select-viewport]")!.getBoundingClientRect();
      return elements.flatMap((element, index) => {
        const row = element.getBoundingClientRect();
        return row.top >= bounds.top && row.bottom <= bounds.bottom ? [index] : [];
      });
    });
    for (const index of visible.slice(0, 3)) await expectHover(page, popup.getByRole("option").nth(index));
    expect((await popup.boundingBox())!.y).toBe(position.y);
    await page.keyboard.press("Home");
    await expect(popup.getByRole("option").first()).toBeFocused();
    await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBe(0);
    await popup.screenshot({ path: info.outputPath("select-" + theme.value + ".png") });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Закрыть", exact: true }).click();
    await page.getByRole("button", { name: "Обзор", exact: true }).click();
  }
});
