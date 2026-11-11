import { expect, type Locator, type Page } from "@playwright/test";
import { mockPanel } from "../../fixtures";

export async function mockUsers(page: Page, count: number): Promise<void> {
  await mockPanel(page);
  const users = Array.from({ length: count }, (_, index) => ({
    id: String(index).padStart(16, "0"),
    name: "🇳🇱 🚀 Phone " + index,
    enabled: true, expires: "", created: "",
  }));
  await page.route("**/api/users", (route) => route.fulfill({ json: users }));
  await page.reload();
}

export async function expectHover(page: Page, option: Locator): Promise<void> {
  const before = (await option.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await expect(option).toHaveAttribute("data-highlighted", "");
  const after = (await option.boundingBox())!;
  expect(after.y).toBe(before.y);
  expect(await option.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
}
