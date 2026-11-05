import { test, expect } from "@playwright/test";
import { mockPanel } from "./panel-fixture";
test("login has a simple password label and accessible language choice", async ({ page }) => {
  await mockPanel(page, false);
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await expect(page.getByText("Пароль администратора")).toHaveCount(0);
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});
test("keyboard selection, resets and saving produce clean ordered YAML", async ({ page }, info) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  const congestion = page.getByLabel("Контроль перегрузки", { exact: true });
  await congestion.click();
  await page.getByRole("option", { name: "reno", exact: true }).click();
  await page.getByRole("button", { name: "Сбросить Контроль перегрузки", exact: true }).click();
  const speed = page.getByLabel("Тест скорости", { exact: true });
  await speed.focus();
  await speed.press("Enter");
  await expect(page.getByRole("option", { name: "Да", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("option", { name: "По умолчанию", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(
    page.getByText("Сохранено. Перезапустите ядро для применения.", { exact: true }),
  ).toBeVisible();
  expect(panel.saved().config).not.toContain("congestion:");
  expect(panel.saved().config).not.toContain("speedTest:");
  expect(panel.saved().config.indexOf("listen:")).toBeLessThan(panel.saved().config.indexOf("tls:"));
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({ path: info.outputPath("configuration.png"), fullPage: true });
});
test("logs support Unicode, search, level filters, pause and clearing", async ({ page }, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Ядро и журнал", exact: true }).click();
  const region = page.getByRole("region", { name: "Сообщения ядра" });
  await expect(region).toContainText("Сертификат обновлён ✓");
  await page.getByRole("searchbox", { name: "Поиск в журнале" }).fill("ACME");
  await expect(region).not.toContainText("Сертификат обновлён");
  await expect(region).toContainText("проверка домена");
  await page.getByRole("combobox", { name: "Уровень сообщений" }).click();
  await page.getByRole("option", { name: "Ошибки", exact: true }).click();
  const follow = page.getByRole("button", { name: "Автопрокрутка", exact: true });
  await follow.click();
  await expect(follow).toHaveAttribute("aria-pressed", "false");
  await page.screenshot({ path: info.outputPath("logs.png"), fullPage: true });
  await page.getByRole("button", { name: "Очистить", exact: true }).click();
  await expect(region).toContainText("Пока нет записей");
});
