import { expect, test } from "@playwright/test";
import { chooseTheme, mockPanel } from "..";

test("selected version stays on one line and the list exposes its full value", async ({ page }, info) => {
  await mockPanel(page);
  await page.route("http://panel.test/api/core/versions", (route) =>
    route.fulfill({ json: [{ tag: "v2.13.0", published: "2026-11-08T10:00:00Z", available: true }] }),
  );
  for (const theme of [
    { label: "Светлая", value: "light" },
    { label: "Тёмная", value: "dark" },
  ]) {
    await chooseTheme(page, theme);
    await page.getByRole("button", { name: "Управление HY2", exact: true }).click();
    const select = page.getByRole("combobox", { name: "Версия HY2", exact: true });
    await expect(select).toContainText("2.13.0 (08.11.2026) (установлена)");
    const geometry = await select.evaluate((element) => {
      const field = element.getBoundingClientRect();
      const value = element.querySelector<HTMLElement>("[data-select-value]")!;
      const range = document.createRange();
      range.selectNodeContents(value);
      const text = range.getBoundingClientRect();
      return {
        top: text.top - field.top,
        bottom: field.bottom - text.bottom,
        textHeight: text.height,
        height: field.height,
        whiteSpace: getComputedStyle(value).whiteSpace,
        overflow: value.scrollWidth > value.clientWidth,
        ellipsis: getComputedStyle(value).textOverflow,
      };
    });
    expect(geometry.whiteSpace).toBe("nowrap");
    expect(geometry.ellipsis).toBe("ellipsis");
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeGreaterThanOrEqual(0);
    expect(geometry.textHeight).toBeLessThan(geometry.height);
    for (const button of await page.locator(".version-controls > button").all()) {
      expect(await button.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await page
      .locator(".version-card")
      .screenshot({ path: info.outputPath("version-" + theme.value + ".png") });
    await select.click();
    await expect(
      page.getByRole("option", { name: "2.13.0 (08.11.2026) (установлена)", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await page.getByRole("button", { name: "Обзор", exact: true }).click();
  }
});
