import { expect, test } from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";

test("panel update is available only for a newer version, including stale catalogs", async ({ page }) => {
  await mockPanel(page);
  let candidate = "v0.7.5";
  await page.route("http://panel.test/api/panel/maintenance", (route) =>
    route.fulfill({
      json: {
        available: true,
        current: "v0.8.9",
        previous: "v0.8.8",
        backupCreated: "2026-11-10T09:00:00Z",
        rollbackAvailable: true,
        operation: { busy: false, phase: "idle" },
      },
    }),
  );
  await page.route("http://panel.test/api/panel/versions", (route) =>
    route.fulfill({ json: [{ version: candidate }] }),
  );
  for (const scenario of [
    { version: "v0.7.5", canUpdate: false },
    { version: "v0.8.9", canUpdate: false },
    { version: "v0.8.10", canUpdate: true },
    { version: "v0.9.0", canUpdate: true },
  ]) {
    candidate = scenario.version;
    await page.reload();
    await page.getByRole("button", { name: "Настройки", exact: true }).click();
    await expandSettings(page);
    await expect(page.getByRole("combobox", { name: "Версия панели", exact: true })).toContainText(
      candidate.slice(1),
    );
    const update = page.getByRole("button", { name: "Обновить панель", exact: true });
    if (scenario.canUpdate) await expect(update).toBeEnabled();
    else await expect(update).toBeDisabled();
    await expect(page.getByRole("button", { name: "Откатить панель", exact: true })).toBeEnabled();
  }
});
