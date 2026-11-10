import { expect, type Locator, type Page } from "@playwright/test";
import { mockPanel } from "../../fixtures";

export async function mockDesign(page: Page): Promise<void> {
  await mockPanel(page);
  await page.route("http://panel.test/api/panel/maintenance", (route) =>
    route.fulfill({
      json: {
        available: true,
        current: "v0.8.0",
        previous: "v0.7.5",
        rollbackAvailable: true,
        operation: { busy: false, phase: "idle" },
      },
    }),
  );
  await page.route("http://panel.test/api/panel/versions", (route) =>
    route.fulfill({ json: [{ version: "v0.8.0" }] }),
  );
}

export async function expectAligned(first: Locator, second: Locator): Promise<void> {
  const left = (await first.boundingBox())!;
  const right = (await second.boundingBox())!;
  expect(Math.abs(left.y + left.height / 2 - right.y - right.height / 2)).toBeLessThanOrEqual(1);
}

export async function expectInside(container: Locator): Promise<void> {
  expect(await container.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
}
