import { expect, test } from "@playwright/test";
import { CLOUD_PASSWORD, MAIN_PASSWORD, mockCloud, signIn } from "./fixture";

test("cloud settings confirm the password and require both steps after enabling", async ({ page }, info) => {
  const fixture = await mockCloud(page, false, true);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  const section = page.locator("#cloud-password");
  await section.getByLabel("Основной пароль", { exact: true }).fill(MAIN_PASSWORD);
  await section.getByLabel("Новый облачный пароль", { exact: true }).fill(CLOUD_PASSWORD);
  await section.getByLabel("Повторите облачный пароль", { exact: true }).fill("different-password");
  await section.getByRole("button", { name: "Включить облачный пароль", exact: true }).click();
  await expect(page.getByText("Пароли не совпадают", { exact: true })).toBeVisible();
  expect(fixture.enabled()).toBe(false);
  await section.getByLabel("Повторите облачный пароль", { exact: true }).fill(CLOUD_PASSWORD);
  await section.screenshot({ path: info.outputPath("cloud-password.png") });
  await section.getByRole("button", { name: "Включить облачный пароль", exact: true }).click();
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  expect(fixture.enabled()).toBe(true);
  await signIn(page, CLOUD_PASSWORD);
  await expect(page.getByRole("heading", { name: "Настройки панели", exact: true })).toBeVisible();
});

test("disabling cloud password requires the current cloud password", async ({ page }) => {
  const fixture = await mockCloud(page, true, true);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  const section = page.locator("#cloud-password");
  await section.getByLabel("Основной пароль", { exact: true }).fill(MAIN_PASSWORD);
  await section.getByLabel("Текущий облачный пароль", { exact: true }).fill(CLOUD_PASSWORD);
  await section.getByRole("checkbox", { name: "Отключить облачный пароль", exact: true }).check();
  await expect(section.getByLabel("Новый облачный пароль", { exact: true })).toHaveCount(0);
  await section.getByRole("button", { name: "Отключить пароль", exact: true }).click();
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
  expect(fixture.enabled()).toBe(false);
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Настройки панели", exact: true })).toBeVisible();
});

test("cloud password content has padding and its reset command can be copied", async ({ page }, info) => {
  await mockCloud(page, false, true);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  const section = page.locator("#cloud-password");
  const geometry = await section.locator(".form-body").evaluate(element => {
    const rect = element.getBoundingClientRect();
    const input = element.querySelector("input")!.getBoundingClientRect();
    const button = element.querySelector(".cloud-password-form > button")!.getBoundingClientRect();
    return { left: input.left - rect.left, right: rect.right - input.right, bottom: rect.bottom - button.bottom };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(16);
  expect(geometry.right).toBeGreaterThanOrEqual(16);
  expect(geometry.bottom).toBeGreaterThanOrEqual(16);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: async (text: string) => { document.body.dataset.copied = text; } } }));
  const command = section.getByRole("group", { name: "Команда для сервера", exact: true });
  await command.getByRole("button", { name: "Скопировать команду", exact: true }).click();
  await expect(page.getByText("Скопировано", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.copied)).toBe("sudo hy2-panel cloud-password-reset");
  await section.screenshot({ path: info.outputPath("cloud-spacing.png") });
});
