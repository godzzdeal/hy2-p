import { test, expect } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("YAML window highlights syntax, catches errors and keeps the draft", async ({ page }, info) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByRole("button", { name: "Открыть редактор YAML", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Редактор YAML", exact: true });
  const editor = dialog.getByRole("textbox", { name: "Конфигурация Hysteria2 YAML", exact: true });
  await expect(editor).toBeVisible();
  await expect(dialog.locator(".yaml-key").first()).toBeVisible();
  await expect(dialog.locator(".cm-lineNumbers")).toBeVisible();
  await editor.fill("listen: [");
  await expect(dialog.getByRole("status")).toContainText("Ошибок YAML:");
  await expect(dialog.getByRole("button", { name: "Сохранить конфигурацию", exact: true })).toBeDisabled();
  const changed = panel.saved().config.replace(":8443", ":61254") + "\n# draft kept\n";
  await editor.fill(changed);
  await expect(dialog.getByRole("status")).toHaveText("YAML без ошибок синтаксиса");
  await dialog.getByRole("button", { name: "К конфигурации", exact: true }).click();
  await expect(page.getByLabel("listen", { exact: true })).toHaveValue(":61254");
  await page.getByRole("button", { name: "Открыть редактор YAML", exact: true }).click();
  await expect(editor).toContainText("draft kept");
  await dialog.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect.poll(() => panel.saved().config).toContain("draft kept");
  await page.screenshot({ path: info.outputPath("yaml-editor.png") });
});

test("YAML search closes before the editor window", async ({ page }) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByRole("button", { name: "Открыть редактор YAML", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Редактор YAML", exact: true });
  const editor = dialog.getByRole("textbox", { name: "Конфигурация Hysteria2 YAML", exact: true });
  await editor.press("Control+f");
  await expect(dialog.locator(".cm-search")).toBeVisible();
  await dialog.locator(".cm-search input").first().press("Escape");
  await expect(dialog.locator(".cm-search")).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await editor.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("multiline properties stay inside their column after resizing", async ({ page }, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByRole("searchbox", { name: "Найти свойство" }).fill("acme.domains");
  await page.getByRole("combobox", { name: "Сертификат Hysteria2", exact: true }).click();
  await page.getByRole("option", { name: "Автоматический сертификат ACME", exact: true }).click();
  const domains = page.getByLabel("acme.domains", { exact: true });
  await domains.fill("first.example.com\nsecond.example.com");
  const initial = await domains.boundingBox();
  await domains.evaluate((element) => {
    element.style.width = "2000px";
    element.style.height = "200px";
  });
  const resized = await domains.boundingBox();
  expect(initial).not.toBeNull();
  expect(resized).not.toBeNull();
  expect(resized!.width).toBeLessThanOrEqual(initial!.width);
  expect(await domains.evaluate((element) => getComputedStyle(element).resize)).toBe("vertical");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("bounded-domains.png"), fullPage: true });
});
