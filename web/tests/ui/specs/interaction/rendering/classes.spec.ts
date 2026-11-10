import { expect, test } from "@playwright/test";
import { mockPanel } from "..";

test("production uses hashed classes for application styles and Tailwind utilities", async ({ page }) => {
  await mockPanel(page);
  for (const title of ["Обзор", "Пользователи", "Конфигурация", "Настройки"]) {
    await page.getByRole("button", { name: title, exact: true }).click();
    const classes = await page
      .locator("body [class]")
      .evaluateAll((elements) => [...new Set(elements.flatMap((element) => [...element.classList]))]);
    expect(classes.length).toBeGreaterThan(40);
    expect(classes.filter((value) => !/^h_[\w-]+$/.test(value))).toEqual([]);
  }
});
