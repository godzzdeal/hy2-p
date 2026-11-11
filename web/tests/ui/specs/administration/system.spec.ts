import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
import { demoSystem } from "@/services/demo/routes/system";

test("overview refreshes server charts and reports panel storage", async ({ page }, info) => {
  if (info.project.name === "desktop") await page.setViewportSize({ width: 900, height: 1000 });
  await mockPanel(page);
  let cpu = 12.5;
  await page.route("**/api/system", (route) => {
    const data = demoSystem();
    data.samples.at(-1)!.cpu = cpu;
    return route.fulfill({ json: data });
  });
  await page.reload();
  const section = page.locator("#overview-system");
  await expect(section.getByRole("img")).toHaveCount(4);
  await section.locator(".system-chart").first().scrollIntoViewIfNeeded();
  await expect(section.getByText("12.5%", { exact: true })).toBeVisible();
  cpu = 25;
  await expect(section.getByText("25.0%", { exact: true })).toBeVisible({ timeout: 4500 });
  await expect(section.getByText("Обновление каждые 3 секунды", { exact: true })).toBeVisible();
  await expect(section.getByText("Резервные копии", { exact: true })).toBeVisible();
  await expect(section.getByText("Образы Docker", { exact: true })).toBeVisible();
  await expect(section.getByText("Архив образа для отката", { exact: true })).toBeVisible();
  await section.scrollIntoViewIfNeeded();
  const geometry = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    height: document.documentElement.scrollHeight,
    viewportHeight: innerHeight,
    footer: document.querySelector(".panel-footer")!.getBoundingClientRect().bottom,
    charts: Array.from(document.querySelectorAll(".system-chart")).map((element) => {
      const rect = element.getBoundingClientRect();
      const caption = element.querySelector("figcaption")!.getBoundingClientRect();
      const period = element.querySelector("small")!.getBoundingClientRect();
      const points = Array.from(element.querySelector("polyline")!.points).map((point) => ({
        x: point.x,
        y: point.y,
      }));
      return {
        inset: caption.left - rect.left,
        width: element.scrollWidth - element.clientWidth,
        bottom: rect.bottom - period.bottom,
        periodTop: period.top,
        headerHeight: caption.height,
        points,
        rendering: getComputedStyle(element.querySelector("polyline")!).shapeRendering,
      };
    }),
  }));
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.height).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.footer).toBe(geometry.viewportHeight);
  for (const chart of geometry.charts) {
    expect(chart.inset).toBeGreaterThanOrEqual(16);
    expect(chart.width).toBe(0);
    expect(chart.bottom).toBeGreaterThanOrEqual(16);
    expect(chart.bottom).toBeLessThanOrEqual(18);
    expect(chart.rendering).toBe("crispedges");
    for (let index = 1; index < chart.points.length; index++) {
      const point = chart.points[index];
      const previous = chart.points[index - 1];
      expect(point.x).toBeGreaterThanOrEqual(previous.x);
      expect(Number.isFinite(point.y)).toBe(true);
    }
  }
  if (info.project.name === "desktop") {
    expect(geometry.charts[3].headerHeight).toBeGreaterThan(geometry.charts[2].headerHeight);
    expect(geometry.charts[0].periodTop).toBe(geometry.charts[1].periodTop);
    expect(geometry.charts[2].periodTop).toBe(geometry.charts[3].periodTop);
  }
  const grid = section.locator(".system-grid").first();
  const chart = grid.locator(".system-chart").first();
  expect((await chart.boundingBox())!.x).toBe((await grid.boundingBox())!.x);
  await page.screenshot({ path: info.outputPath("system-overview.png") });
  await section.locator(".system-storage").screenshot({ path: info.outputPath("image-storage.png") });
});

test("unavailable Linux metrics preserve disk usage without fake charts", async ({ page }) => {
  await mockPanel(page);
  await page.route("**/api/system", (route) =>
    route.fulfill({
      json: {
        ...demoSystem(),
        available: false,
        samples: [],
        error: "Системные показатели доступны на Linux",
      },
    }),
  );
  await page.reload();
  const section = page.locator("#overview-system");
  await expect(section.getByText("Системные показатели доступны на Linux", { exact: true })).toBeVisible();
  await expect(section.getByRole("img")).toHaveCount(0);
  await expect(section.getByRole("heading", { name: "Место на диске", exact: true })).toBeVisible();
});
