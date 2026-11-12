import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";

test("storage forms and connected accounts stay aligned on desktop and mobile", async ({ page }, info) => {
  await mockPanel(page);
  let accounts = [{ id: "a".repeat(32), name: "🌌 Резервные копии организации с длинным названием", provider: "yandex", folder: "HY2-P/Организация/Бэкапы" }];
  const inputs: Record<string, string>[] = [];
  await page.route("**/api/admin/backups/storages", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { accounts } });
    const input = route.request().postDataJSON() as Record<string, string>;
    inputs.push(input);
    if (input.action === "providers") return route.fulfill({ json: { providers: [{ id: "yandex", name: "Яндекс Диск", hasSecret: true, clientId: "test-app" },{id:"google",name:"Google Drive",hasSecret:false}] } });
    if (input.action === "create") accounts.push({ id: "b".repeat(32), name: input.name, provider: input.provider, folder: input.folder });
    if (input.action === "delete") accounts = accounts.filter((account) => account.id !== input.id);
    return route.fulfill({ json: accounts });
  });
  await page.getByRole("link", { name: "Настройки", exact: true }).click();
  const section = page.locator("#panel-backups");
  await section.getByRole("button", { name: "Резервные копии", exact: true }).click();
  await expect(section.getByText(accounts[0].name)).toBeVisible();
  await section.getByRole("button", { name: "Подключить", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Войти в аккаунт", exact: true })).toBeEnabled();
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "Google Drive", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Войти в аккаунт", exact: true })).toBeDisabled();
  await expect(dialog.getByLabel("Client ID",{exact:true})).toBeVisible();
  await page.screenshot({ path: info.outputPath("storage-provider-setup.png") });
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "S3", exact: true }).click();
  await dialog.getByLabel("Название", { exact: true }).fill("S3 организации");
  await dialog.getByLabel("Бакет и папка", { exact: true }).fill("backups/HY2-P");
  await dialog.getByLabel("Адрес сервиса", { exact: true }).fill("https://s3.example.invalid");
  await dialog.getByLabel("Ключ доступа", { exact: true }).fill("test-access");
  await dialog.getByLabel("Секретный ключ", { exact: true }).fill("test-private-secret");
  await expect(dialog.getByLabel("Секретный ключ", { exact: true })).toHaveAttribute("type", "password");
  await page.screenshot({ path: info.outputPath("storage-s3-form.png") });
  const dialogBox = (await dialog.boundingBox())!;
  const controls = await dialog.locator("input,button[role=combobox]").all();
  for (const control of controls) {
    const box = await control.boundingBox();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(dialogBox.x + 12);
      expect(box.x + box.width).toBeLessThanOrEqual(dialogBox.x + dialogBox.width - 12);
    }
  }
  await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(section.getByText("S3 организации", { exact: true })).toBeVisible();
  expect(inputs.find((input) => input.action === "create")?.secretKey).toBe("test-private-secret");
  await expect(section).not.toContainText("test-private-secret");
  const second = section.getByRole("listitem").filter({ hasText: "S3 организации" });
  await second.getByRole("button", { name: "Отключить", exact: true }).click();
  await expect(dialog).toContainText("Файлы в облаке сохранятся.");
  await dialog.getByRole("button", { name: "Отключить", exact: true }).click();
  await expect(section.getByText("S3 организации", { exact: true })).not.toBeVisible();
  await section.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("storage-accounts.png") });
});

test("cloud access check targets the selected storage", async ({ page }) => {
  await mockPanel(page);
  let selected = "";
  await page.route("**/api/admin/backups/storages", (route) => route.fulfill({ json: { accounts: [{ id: "c".repeat(32), name: "OneDrive", provider: "onedrive", folder: "HY2-P" }] } }));
  await page.route("**/api/panel/maintenance", async (route) => {
    const input = route.request().postDataJSON() as { storageId: string; action: string };
    selected = input.storageId;
    expect(input.action).toBe("check-cloud");
    return route.fulfill({ status: 202, json: { id: "d".repeat(32), busy: true, phase: "queued" } });
  });
  await page.getByRole("link", { name: "Настройки", exact: true }).click();
  const section = page.locator("#panel-backups");
  await section.getByRole("button", { name: "Резервные копии", exact: true }).click();
  await section.getByRole("listitem").getByRole("button", { name: "Проверить", exact: true }).click();
  await expect.poll(() => selected).toBe("c".repeat(32));
});

test("cloud sign-in returns from the local callback without exposing tokens", async ({ page, context }, info) => {
  await mockPanel(page);
  const state = "e".repeat(48);
  let accounts: { id: string; name: string; provider: string; folder: string }[] = [];
  const frontend = process.env.PLAYWRIGHT_FRONTEND_URL ?? "http://127.0.0.1:3000";
  await context.route("https://oauth.yandex.ru/authorize**", (route) => route.fulfill({ status: 302, headers: { Location: frontend + "/connect/callback/yandex?state=" + state + "&code=test-provider-code" } }));
  await page.route("**/api/admin/backups/storages", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { accounts } });
    const input = route.request().postDataJSON() as Record<string, string>;
    if (input.action === "providers") return route.fulfill({ json: { providers: [{ id: "yandex", name: "Яндекс Диск", hasSecret: true, clientId: "test-app" }] } });
    if (input.action === "authorize") return route.fulfill({ json: { url: "https://oauth.yandex.ru/authorize?state=" + state, state, origin: frontend } });
    if (input.action === "complete") {
      expect(input.state).toBe(state);
      expect(input.code).toBe("test-provider-code");
      accounts = [{ id: "f".repeat(32), name: "Мой Диск", provider: "yandex", folder: "HY2-P" }];
      return route.fulfill({ json: accounts });
    }
    return route.fulfill({ status: 400, json: { error: "Unexpected request" } });
  });
  await page.getByRole("link", { name: "Настройки", exact: true }).click();
  const section = page.locator("#panel-backups");
  await section.getByRole("button", { name: "Резервные копии", exact: true }).click();
  await section.getByRole("button", { name: "Подключить", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Название", { exact: true }).fill("Мой Диск");
  if (info.project.name.startsWith("mobile")) await page.evaluate(() => { window.open = () => null; });
  await dialog.getByRole("button", { name: "Войти в аккаунт", exact: true }).click();
  if (info.project.name.startsWith("mobile")) await page.getByRole("link", { name: /Вернуться в панель/ }).click();
  await expect(dialog).not.toBeVisible();
  await expect(section.getByText("Мой Диск", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/settings$/);
});
