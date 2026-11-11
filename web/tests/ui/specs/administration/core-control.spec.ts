import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";

for (const isSuccessful of [true, false]) {
  test(`instance restart progress survives navigation and reports ${isSuccessful ? "success" : "failure"}`, async ({
    page,
  }, info) => {
    await mockPanel(page);
    let finish = () => {};
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    await page.route("**/api/core/restart", async (route) => {
      await pending;
      await route.fulfill(
        isSuccessful
          ? { json: { available: true, running: true, logs: "", binary: "hysteria" } }
          : { status: 400, json: { error: "Не удалось перезапустить экземпляр" } },
      );
    });
    await page.getByRole("link", { name: "Управление HY2", exact: true }).click();
    await page.getByRole("button", { name: "Перезапустить", exact: true }).click();
    const progress = page.getByLabel("Управление экземпляром", { exact: true });
    await expect(progress).toContainText("Перезапускаем экземпляр «Основной»…");
    await expect(page.getByRole("button", { name: "Перезапустить", exact: true })).toBeDisabled();
    await page.getByRole("link", { name: "Пользователи", exact: true }).click();
    await expect(progress).toBeVisible();
    await page.screenshot({ path: info.outputPath("restart-on-another-page.png") });
    finish();
    await expect(progress).toHaveCount(0);
    await expect(
      page.getByText(isSuccessful ? "Экземпляр перезапущен." : "Не удалось перезапустить экземпляр", {
        exact: true,
      }),
    ).toBeVisible();
    if (!isSuccessful) await page.getByRole("button", { name: "Закрыть уведомление", exact: true }).click();
    await page.getByRole("link", { name: "Управление HY2", exact: true }).click();
    await expect(page.getByRole("button", { name: "Перезапустить", exact: true })).toBeEnabled();
  });
}

test("a healthy watchdog never reports a historical crash as a current error", async ({ page }) => {
  await mockPanel(page);
  const { PANEL_METADATA } = await import("../../fixtures/data");
  const instances = PANEL_METADATA["/api/instances"] as Record<string, unknown>[];
  let reads = 0;
  await page.route("**/api/instances", (route) => {
    reads++;
    return route.fulfill({
      json: [
        {
          ...instances[0],
          watchdog: {
            desiredRunning: true,
            state: "watching",
            lastCrash: "2026-11-10T10:00:00Z",
            lastError: "old error",
            message: "Watchdog следит за процессом",
          },
        },
      ],
    });
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ваш сервер", exact: true })).toBeVisible();
  await expect.poll(() => reads, { timeout: 10000 }).toBeGreaterThan(1);
  await expect(page.locator(".notifications").getByRole("alert")).toHaveCount(0);
});
