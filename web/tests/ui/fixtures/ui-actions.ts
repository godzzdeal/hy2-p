import { expect, type Page } from "@playwright/test";
export async function chooseTheme(page: Page, choice: { label: string; value: string }): Promise<void> {
  await page
    .getByRole("group", { name: "Тема", exact: true })
    .getByRole("button", { name: choice.label, exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", choice.value);
  await page.evaluate(() => document.fonts.ready);
}

export async function chooseUserAction(page: Page, user: string, action: string): Promise<void> {
  const trigger = page.getByRole("button", { name: "Действия " + user, exact: true, includeHidden: true });
  await trigger.waitFor({ state: "attached" });
  if (await trigger.isVisible()) await trigger.click();
  await page.getByRole("button", { name: action + " " + user, exact: true }).click();
}

export async function expandSettings(page: Page): Promise<void> {
  const toggles = page.locator(".settings-toggle");
  await toggles.first().waitFor();
  const sections = await toggles.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-controls")),
  );
  for (const section of sections) {
    if (!section) throw new Error("Settings toggle has no target");
    const toggle = page.locator('[aria-controls="' + section + '"]');
    if ((await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }
}
