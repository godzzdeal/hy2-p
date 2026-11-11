import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";

test("latest version is not replaced by an older default and update controls are compact", async ({
  page,
}, info) => {
  await mockPanel(page);
  await page.route("**/api/core/versions", (route) =>
    route.fulfill({
      json: [
        { tag: "app/v2.13.0", available: true, published: "2026-11-01T00:00:00Z" },
        { tag: "app/v2.12.0", available: true, published: "2026-10-01T00:00:00Z" },
      ],
    }),
  );
  await page.getByRole("link", { name: "Управление HY2", exact: true }).click();
  const card = page.locator(".version-card");
  await expect(card.getByRole("button", { name: "Установлена", exact: true })).toBeDisabled();
  await expect(card.getByText("Установлена последняя версия", { exact: true })).toBeVisible();
  const height = (await card.boundingBox())!.height;
  expect(height).toBeLessThan(info.project.name === "mobile" ? 360 : 240);
  await card.getByRole("combobox", { name: "Версия HY2", exact: true }).click();
  await page.getByRole("option", { name: "2.12.0", exact: false }).click();
  await expect(card.getByRole("button", { name: "Установить", exact: true })).toBeEnabled();
  await card.screenshot({ path: info.outputPath("compact-update.png") });
});
