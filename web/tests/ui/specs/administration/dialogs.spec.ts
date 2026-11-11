import { expect, test } from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";

test("Escape dismisses only the current confirmation inside panel maintenance", async ({ page }) => {
  await mockPanel(page);
  await page.route("**/api/panel/update", (route) =>
    route.fulfill({ json: { current: "v0.8.0", latest: "v0.9.0", state: "update_available" } }),
  );
  await page.route("**/api/panel/maintenance", (route) =>
    route.fulfill({
      json: {
        available: true,
        current: "v0.8.0",
        previous: "",
        backupCreated: "",
        rollbackAvailable: false,
        operation: { busy: false, phase: "idle" },
      },
    }),
  );
  await page.route("**/api/panel/versions", (route) =>
    route.fulfill({ json: [{ version: "v0.9.0" }] }),
  );
  await page.reload();
  await page.getByRole("button", { name: "Обновить панель", exact: true }).click();
  const parent = page.getByRole("dialog", { name: "Обновление панели", exact: true });
  await parent.getByRole("button", { name: "Обновить панель", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Обновить панель?", exact: true });
  await expect(confirmation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(confirmation).toHaveCount(0);
  await expect(parent).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(parent).toHaveCount(0);
});

test("opening settings keeps its target when a late section is inserted", async ({ page }) => {
  await page.setContent("<main></main>");
  await page.evaluate(() => {
    function appendSection(id: string): HTMLButtonElement {
      const button = document.createElement("button");
      button.className = "settings-toggle";
      button.textContent = id;
      button.setAttribute("aria-controls", id);
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", () => button.setAttribute("aria-expanded", "true"));
      document.querySelector("main")!.append(button);
      return button;
    }
    const first = appendSection("first");
    appendSection("second");
    appendSection("maintenance");
    first.addEventListener("click", () => document.querySelector("main")!.prepend(appendSection("late")), {
      once: true,
    });
  });
  await expandSettings(page);
  for (const name of ["first", "second", "maintenance"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-expanded", "true");
  }
});
