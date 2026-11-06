import { test, expect } from "@playwright/test";
import { mockPanel } from "../fixtures";
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
  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Конфигурация сервера", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(page.getByText("Конфигурация сохранена.", { exact: true })).toBeVisible();
  expect(panel.saved().config).not.toContain("congestion:");
  expect(panel.saved().config).not.toContain("speedTest:");
  expect(panel.saved().config.indexOf("listen:")).toBeLessThan(panel.saved().config.indexOf("tls:"));
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    )
    .toBe(true);
  await page.screenshot({ path: info.outputPath("configuration.png"), fullPage: true });
});

test("UDP application survives reload and expired login", async ({ page }) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByLabel("Публичный UDP-порт", { exact: true }).fill("61254");
  await page.getByLabel("Порт Hysteria2", { exact: true }).fill(":61254");
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(
    page.getByText("Сохранённые порты: снаружи 61254, в контейнере 61254.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Применить UDP-порт", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Применение UDP-порта" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  await expect(page.getByText("UDP-порт применён", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Понятно", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Применение UDP-порта" })).toHaveCount(0);
});

test("configuration can be applied without leaving the page", async ({ page }) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByLabel("Тест скорости", { exact: true }).click();
  await page.getByRole("option", { name: "Нет", exact: true }).click();
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(page.getByText("Конфигурация сохранена", { exact: true })).toBeVisible();
  expect(panel.coreActions).toEqual([]);
  await page.getByRole("button", { name: "Перезапустить ядро", exact: true }).click();
  await expect.poll(() => panel.coreActions).toEqual(["restart"]);
  await expect(page.getByText("Конфигурация сохранена", { exact: true })).toHaveCount(0);
});
