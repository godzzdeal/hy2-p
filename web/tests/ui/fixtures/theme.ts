import { expect, type Page } from "@playwright/test";
export async function chooseTheme(page: Page, choice: { label: string; value: string }): Promise<void> {
  await page.getByRole("combobox", { name: "Тема", exact: true }).click();
  await page.getByRole("option", { name: choice.label, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", choice.value);
  await page.evaluate(() => document.fonts.ready);
}
