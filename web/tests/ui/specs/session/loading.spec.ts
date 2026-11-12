import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";

test("startup loader spins, announces loading and respects reduced motion", async ({ page }, info) => {
  await mockPanel(page);
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/session", async (route) => {
    await pending;
    await route.fulfill({ json: { ok: true } });
  });
  try {
    await page.reload();
    const loader = page.locator(".startup-loader");
    await expect(loader).toBeVisible();
    await expect(loader).toHaveAttribute("role", "status");
    await expect(loader).toContainText("Загрузка…");
    const spinner = loader.locator(".spinner");
    expect(await spinner.evaluate((element) => element.getAnimations().some((animation) => animation.playState === "running"))).toBe(true);
    const transform = await spinner.evaluate((element) => getComputedStyle(element).transform);
    await expect.poll(() => spinner.evaluate((element) => getComputedStyle(element).transform)).not.toBe(transform);
    await page.screenshot({ path: info.outputPath("startup-loader.png") });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await spinner.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    release();
    await expect(page.getByRole("heading", { name: "Ваш сервер", exact: true })).toBeVisible();
    await expect(loader).toHaveCount(0);
  } finally {
    release();
  }
});

test("API waits use the same loader and leave no spinner after completion", async ({ page }) => {
  await mockPanel(page);
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/users", async (route) => {
    await pending;
    await route.fulfill({ json: [] });
  });
  try {
    await page.reload();
    await page.getByRole("link", { name: "Пользователи", exact: true }).click();
    const loader = page.locator("#users-list .loader");
    await expect(loader).toBeVisible();
    await expect(loader.locator(".spinner")).toBeVisible();
    release();
    await expect(loader).toHaveCount(0);
    await expect(
      page.getByText("Создайте пользователя, чтобы получить ссылку подключения.", { exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
});
