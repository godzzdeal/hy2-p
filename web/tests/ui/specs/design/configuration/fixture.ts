import { expect, type Page } from "@playwright/test";

export async function selectSection(page: Page, title: string): Promise<void> {
  const navigation=page.getByRole("navigation",{name:"Разделы конфигурации",exact:true});
  await navigation.getByRole("button",{name:title,exact:true}).click();
  await expect(page.locator(".configuration-section-title").getByRole("heading",{name:title,exact:true})).toBeVisible();
}
