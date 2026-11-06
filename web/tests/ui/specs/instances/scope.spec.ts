import { test, expect } from "@playwright/test";
import { mockInstances, EXTRA_ID } from "./fixture";
test("switching cores protects drafts and scopes logs and updates", async ({ page }) => {
  const fixture = await mockInstances(page, true);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByLabel("Публичный адрес", { exact: true }).fill("unsaved.example.org");
  await page.getByRole("combobox", { name: "Выбранное ядро", exact: true }).click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("option", { name: "Второй", exact: true }).click();
  await expect(page.getByLabel("Публичный адрес", { exact: true })).toHaveValue("unsaved.example.org");
  await page.getByRole("combobox", { name: "Выбранное ядро", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("option", { name: "Второй", exact: true }).click();
  await expect(page.getByLabel("Публичный адрес", { exact: true })).toHaveValue("second.example.org");
  await page.getByRole("button", { name: "Ядро и журнал", exact: true }).click();
  await expect(page.getByText("SECOND ENGINE LOG", { exact: true })).toBeVisible();
  await expect(page.getByText("v2.12.0", { exact: true })).toBeVisible();
  expect(fixture.requests).toContain("GET /api/instances/" + EXTRA_ID + "/core");
  expect(fixture.panel.saved().host).toBe("vpn.example.org");
});
test("a pending save cannot be redirected to another core", async ({ page }) => {
  await mockInstances(page, true);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByLabel("Публичный адрес", { exact: true }).fill("saved.example.org");
  let finish: (() => void) | undefined;
  await page.route("http://panel.test/api/settings", async (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    await route.fulfill({ json: route.request().postDataJSON() });
  });
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Выбранное ядро", exact: true })).toBeDisabled();
  await expect.poll(() => !!finish).toBe(true);
  finish?.();
  await expect(page.getByRole("combobox", { name: "Выбранное ядро", exact: true })).toBeEnabled();
});

test("connection links let the user select a core", async ({ page }) => {
  await mockInstances(page, true);
  const links = {
    uri: "hysteria2://password@vpn.example.org:8443/#First",
    subscription: "https://panel.test/sub/token",
    connections: [
      { instanceId: "default", name: "Основной", uri: "hysteria2://password@vpn.example.org:8443/#First" },
      { instanceId: EXTRA_ID, name: "Второй", uri: "hysteria2://password@vpn.example.org:8444/#Second" },
    ],
  };
  await page.route("http://panel.test/api/users/test-user/links", (route) => route.fulfill({ json: links }));
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Добавить пользователя", exact: true }).click();
  await page.getByLabel("Имя", { exact: true }).fill("Phone");
  await page.getByRole("button", { name: "Сохранить пользователя", exact: true }).click();
  await page.getByRole("button", { name: "Подключение Phone", exact: true }).click();
  await page.getByRole("combobox", { name: "Ядро подключения", exact: true }).click();
  await page.getByRole("option", { name: "Второй", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Ссылка подключения", exact: true })).toHaveValue(
    links.connections[1]!.uri,
  );
  await page.getByRole("button", { name: "Подписка", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Ссылка подключения", exact: true })).toHaveValue(
    links.subscription,
  );
});
