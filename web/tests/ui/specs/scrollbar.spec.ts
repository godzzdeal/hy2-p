import { expect, test } from "@playwright/test";
import { mockPanel } from "../fixtures";

test("the main scrollbar stays at the viewport edge with a separate gap for content and section navigation", async ({
  page,
}, info) => {
  await mockPanel(page);
  await page.getByRole("link", { name: "Конфигурация", exact: true }).click();
  await page.getByRole("button", { name: "QUIC parameters", exact: true }).click();
  await expect(page.getByLabel("quic.maxIdleTimeout", { exact: true })).toBeVisible();
  if (info.project.name === "desktop") await expect(page.locator(".scroll-navigation")).toBeVisible();
  else await expect(page.locator(".scroll-navigation")).toBeHidden();
  const widths = info.project.name === "mobile" ? [320, 390] : [900, 1440, 1920, 2560];
  for (const width of widths) {
    await page.setViewportSize({ width, height: info.project.name === "mobile" ? 844 : 1000 });
    const geometry = await page.evaluate(() => {
      const viewport = document.querySelector<HTMLElement>(".content")!;
      const content = document.querySelector<HTMLElement>(".page-content")!;
      const navigation = document.querySelector(".scroll-navigation")!.getBoundingClientRect();
      const box = viewport.getBoundingClientRect();
      const card = content.querySelector(".card")!.getBoundingClientRect();
      return {
        right: box.right,
        viewport: innerWidth,
        scrollHeight: viewport.scrollHeight,
        clientHeight: viewport.clientHeight,
        scrollbar: box.width - viewport.clientWidth,
        cardRight: card.right,
        trackLeft: box.left + viewport.clientWidth,
        navLeft: navigation.left,
        navRight: navigation.right,
        navTop: navigation.top,
        bottom: box.bottom,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(geometry.right).toBe(geometry.viewport);
    expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
    expect(geometry.trackLeft - geometry.cardRight).toBeGreaterThanOrEqual(16);
    expect(geometry.overflow).toBe(0);
    if (info.project.name === "desktop") {
      expect(geometry.trackLeft - geometry.navRight).toBeGreaterThanOrEqual(8);
      expect(geometry.navLeft - geometry.cardRight).toBeGreaterThanOrEqual(8);
    }
    await page.locator(".content").evaluate((element) => element.scrollTo(0, element.scrollHeight));
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await page.screenshot({ path: info.outputPath(`scrollbar-${width}.png`) });
  }
});
