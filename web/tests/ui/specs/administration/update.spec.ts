import { expect, test } from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";

const INSTALLATION = {
  available: true,
  current: "v0.7.5",
  previous: "v0.7.4",
  backupCreated: "2026-11-10T09:00:00Z",
  rollbackAvailable: true,
  operation: { busy: false, phase: "idle" },
};
const TICKET = "c".repeat(32);

for (const action of ["update", "rollback"] as const) {
  test(`panel ${action} requires confirmation, keeps progress across reload and supports old status endpoint`, async ({
    page,
  }, info) => {
    await mockPanel(page);
    let submitted: unknown;
    let isFinished = false;
    await page.route("http://panel.test/api/panel/maintenance", (route) => {
      if (route.request().method() === "GET") return route.fulfill({ json: INSTALLATION });
      submitted = route.request().postDataJSON();
      return route.fulfill({ status: 202, json: { id: TICKET, busy: true, phase: "queued" } });
    });
    await page.route("http://panel.test/api/panel/versions", (route) =>
      route.fulfill({ json: [{ version: "v0.7.6" }, { version: "v0.7.5" }] }),
    );
    await page.route("http://panel.test/api/deployment/udp/status/*", (route) =>
      route.fulfill({
        json: {
          id: TICKET,
          busy: !isFinished,
          phase: isFinished ? "success" : "updating",
          message: isFinished ? "Панель обновлена. Войдите снова." : "Обновляем панель",
        },
      }),
    );
    await page.getByRole("button", { name: "Настройки", exact: true }).click();
    await expandSettings(page);
    const update = page.getByRole("button", { name: "Обновить панель", exact: true });
    await page.getByRole("combobox", { name: "Версия панели", exact: true }).click();
    await page.getByRole("option", { name: "0.7.5", exact: true }).click();
    await expect(update).toBeDisabled();
    await page.getByRole("combobox", { name: "Версия панели", exact: true }).click();
    await page.getByRole("option", { name: "0.7.6", exact: true }).click();
    const button =
      action === "update" ? update : page.getByRole("button", { name: "Откатить панель", exact: true });
    await button.click();
    const dialog = page.getByRole("dialog", {
      name: action === "update" ? "Обновить панель?" : "Откатить панель?",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    expect(submitted).toBeUndefined();
    if (action === "rollback") await expect(dialog).toContainText("данные из копии");
    await dialog.screenshot({ path: info.outputPath(action + "-confirmation.png") });
    await dialog
      .getByRole("button", { name: action === "update" ? "Обновить" : "Откатить", exact: true })
      .click();
    await expect(page.getByLabel("Обслуживание панели", { exact: true })).toBeVisible();
    expect(submitted).toEqual(
      action === "update" ? { action, version: "v0.7.6" } : { action, restoreData: true },
    );
    await page.reload();
    await expect(page.getByLabel("Обслуживание панели", { exact: true })).toBeVisible();
    isFinished = true;
    await expect(page.getByRole("button", { name: "Открыть панель", exact: true })).toBeVisible();
    await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  });
}

test("image cleanup is confirmed, preserves the session and refreshes disk usage", async ({ page }, info) => {
  await mockPanel(page);
  let submitted: unknown;
  let isFinished = false;
  await page.route("http://panel.test/api/panel/maintenance", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: {
          ...INSTALLATION,
          operation:
            submitted && !isFinished
              ? { id: TICKET, operation: "cleanup", busy: true, phase: "cleaning" }
              : INSTALLATION.operation,
        },
      });
    submitted = route.request().postDataJSON();
    return route.fulfill({ status: 202, json: { id: TICKET, busy: true, phase: "cleaning" } });
  });
  await page.route("http://panel.test/api/panel/versions", (route) =>
    route.fulfill({ json: [{ version: "v0.7.5" }] }),
  );
  await page.route("http://panel.test/api/deployment/udp/status/*", (route) =>
    route.fulfill({
      json: {
        id: TICKET,
        busy: !isFinished,
        phase: isFinished ? "success" : "cleaning",
        message: isFinished
          ? "Старые образы удалены. Текущая версия и откат сохранены."
          : "Удаляем старые образы",
      },
    }),
  );
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  await page.getByRole("button", { name: "Удалить старые образы", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Удалить старые образы?", exact: true });
  await expect(dialog).toContainText("сжатом архиве");
  await expect(dialog).toContainText("Данные и резервные копии сохранятся");
  expect(submitted).toBeUndefined();
  await dialog.screenshot({ path: info.outputPath("image-cleanup-confirmation.png") });
  await dialog.getByRole("button", { name: "Удалить", exact: true }).click();
  await expect(page.getByLabel("Обслуживание панели", { exact: true })).toBeVisible();
  expect(submitted).toEqual({ action: "cleanup" });
  await page.reload();
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  await expect(page.getByRole("button", { name: "Удалить старые образы", exact: true })).toBeDisabled();
  isFinished = true;
  await expect(
    page.getByText("Старые образы удалены. Текущая версия и откат сохранены.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Обслуживание панели", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Пароль", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Обзор", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ваш сервер", exact: true })).toBeVisible();
});
