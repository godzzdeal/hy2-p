import { expect, test } from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";

test("panel restart requires confirmation and survives the expected outage", async ({ page }, info) => {
  await mockPanel(page);
  let starts = 0;
  let polls = 0;
  await page.route("http://panel.test/api/panel/restart", async (route) => {
    starts++;
    await route.fulfill({
      status: 202,
      json: { id: "a".repeat(32), busy: true, phase: "restarting", message: "Перезапуск" },
    });
  });
  await page.route("http://panel.test/api/panel/restart/*", async (route) => {
    polls++;
    if (polls === 1) {
      await page.evaluate(() => window.dispatchEvent(new Event("session-expired")));
      return route.abort("connectionrefused");
    }
    await route.fulfill({
      json: { id: "a".repeat(32), busy: false, phase: "success", message: "Панель перезапущена" },
    });
  });
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  await page.getByRole("button", { name: "Перезапустить панель", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Перезапустить панель?", exact: true });
  await expect(dialog).toBeVisible();
  expect(starts).toBe(0);
  await dialog.screenshot({ path: info.outputPath("restart-confirmation.png") });
  await dialog.getByRole("button", { name: "Перезапустить", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Перезапустить", exact: true })).toBeDisabled();
  await expect(dialog.getByText("Панель перезапускается…", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Закрыть", exact: true })).toBeDisabled();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Панель перезапущена. Войдите снова.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  expect(starts).toBe(1);
  expect(polls).toBeGreaterThan(1);
  await expect(
    page.getByText("Панель недоступна. Проверьте соединение и повторите действие.", { exact: true }),
  ).toHaveCount(0);
});

test("restart errors are shown as notifications and allow retry", async ({ page }) => {
  await mockPanel(page);
  await page.route("http://panel.test/api/panel/restart", (route) =>
    route.fulfill({ status: 503, json: { error: "Помощник Docker недоступен" } }),
  );
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  await page.getByRole("button", { name: "Перезапустить панель", exact: true }).click();
  const button = page.getByRole("dialog").getByRole("button", { name: "Перезапустить", exact: true });
  await button.click();
  await expect(page.getByText("Помощник Docker недоступен", { exact: true })).toBeVisible();
  await expect(button).toBeEnabled();
});
