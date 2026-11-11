import { expect, type Page } from "@playwright/test";
export async function chooseTheme(page: Page, choice: {label:string;value:string}):Promise<void> {
 const button = page.getByRole("button",{name:"Тема",exact:true});
 await expect(button).toHaveAttribute("data-theme-mode",/system|light|dark/);
 for (let attempt = 0; attempt < 3 && await button.getAttribute("data-theme-mode") !== choice.value; attempt++) {
  await button.click();
 }
 const expected=choice.value === "system" ? await page.evaluate(()=>matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light") : choice.value;
 await expect(page.locator("html")).toHaveAttribute("data-theme",expected);
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem("hy2.theme"))).toBe(choice.value);
 await page.evaluate(()=>document.fonts.ready);
}
export async function waitForAppearance(page:Page):Promise<void> { await page.locator(".appearance-controls").waitFor(); }

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
