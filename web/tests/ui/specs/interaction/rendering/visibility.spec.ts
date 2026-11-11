import { expect, test } from "@playwright/test";
import { mockPanel } from "..";
import { demoSystem } from "@/services/demo/routes/system";

test("offscreen charts retain their geometry and refresh when shown again", async ({ page }) => {
  await mockPanel(page);
  let cpu = 12.5;
  let polls = 0;
  await page.route("**/api/system", (route) => {
    polls++;
    const data = demoSystem();
    data.samples.at(-1)!.cpu = cpu;
    return route.fulfill({ json: data });
  });
  await page.reload();
  const chart = page.locator(".system-chart").first();
  await chart.scrollIntoViewIfNeeded();
  await expect(chart.locator("figcaption strong")).toHaveText("12.5%");
  const height = (await chart.boundingBox())!.height;
  const content = page.locator(".content");
  await content.evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: "instant" }));
  await expect
    .poll(() =>
      chart.evaluate((element) => {
        const parent = element.closest("[data-page-content]")!.getBoundingClientRect();
        return element.getBoundingClientRect().bottom <= parent.top;
      }),
    )
    .toBe(true);
  const previous = polls;
  cpu = 75;
  await expect.poll(() => polls).toBeGreaterThan(previous);
  await expect(chart.locator("figcaption strong")).toHaveText("12.5%");
  expect((await chart.boundingBox())!.height).toBe(height);
  await chart.scrollIntoViewIfNeeded();
  await expect(chart.locator("figcaption strong")).toHaveText("75.0%");
});
