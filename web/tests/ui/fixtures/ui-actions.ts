import { expect, type Page } from "@playwright/test";
export async function chooseTheme(page: Page, choice: { label: string; value: string }): Promise<void> {
  await page.getByRole("combobox", { name: "Тема", exact: true }).click();
  await page.getByRole("option", { name: choice.label, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", choice.value);
  await page.evaluate(() => document.fonts.ready);
}

export async function chooseUserAction(page: Page, user: string, action: string): Promise<void> {
  const trigger = page.getByRole("button", { name: "Действия " + user, exact: true, includeHidden: true });
  await trigger.waitFor({ state: "attached" });
  if (await trigger.isVisible()) await trigger.click();
  await page.getByRole("button", { name: action + " " + user, exact: true }).click();
}
