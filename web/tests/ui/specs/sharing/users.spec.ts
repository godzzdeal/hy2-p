import { test, expect } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("refresh updates total counts and filtering keeps the total", async ({ page }, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  const counters = page.getByLabel("Всего пользователей: 0", { exact: true });
  await expect(counters).toHaveCount(2);
  const users = Array.from({ length: 6 }, (_, index) => ({
    id: "external-" + index,
    name: "Player " + index,
    enabled: true,
    expires: "",
    created: "",
  }));
  let trafficRequests = 0;
  await page.route("http://panel.test/api/users", (route) => route.fulfill({ json: users }));
  await page.route("http://panel.test/api/traffic", (route) => {
    trafficRequests++;
    return route.fulfill({ json: { available: true, users: {}, updated: "" } });
  });
  const request = page.waitForRequest("http://panel.test/api/users");
  await page.getByRole("button", { name: "Обновить", exact: true }).click();
  await request;
  await expect(page.getByLabel("Всего пользователей: 6", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Список пользователей обновлён", { exact: true })).toBeVisible();
  expect(trafficRequests).toBeGreaterThan(0);
  await page.getByRole("searchbox", { name: "Поиск пользователей", exact: true }).fill("Player 5");
  await expect(page.getByText("Найдено: 1", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Всего пользователей: 6", { exact: true })).toHaveCount(2);
  await page.screenshot({ path: info.outputPath("users-count-refresh.png") });
});
test("users have a flag icon and emoji remain in their name", async ({ page }, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Добавить пользователя", exact: true }).click();
  await page.getByLabel("Имя", { exact: true }).fill("👩🏽‍💻 Телефон");
  await page.getByRole("combobox", { name: "Флаг", exact: true }).click();
  await page.getByRole("option", { name: /Германия/ }).click();
  await expect(page.getByLabel("Имя", { exact: true })).toHaveValue("👩🏽‍💻 Телефон");
  const name = await page.getByLabel("Имя", { exact: true }).boundingBox();
  const flag = await page.getByRole("combobox", { name: "Флаг", exact: true }).boundingBox();
  expect(name).not.toBeNull();
  expect(flag).not.toBeNull();
  expect(flag!.height).toBe(name!.height);
  if (info.project.name === "desktop") expect(flag!.y).toBe(name!.y);
  await page
    .getByRole("dialog", { name: "Новый пользователь", exact: true })
    .screenshot({ path: info.outputPath("user-editor.png") });
  await page.getByRole("button", { name: "Сохранить пользователя", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "Телефон" });
  await expect(row.locator(".avatar img")).toHaveAttribute("src", "/flags/de.svg");
  await expect(row.locator("img.emoji-image")).toHaveAttribute("src", "/emoji/1f469-1f3fd-200d-1f4bb.svg");
  await expect(row.getByRole("button", { name: "Подключение 🇩🇪 👩🏽‍💻 Телефон", exact: true })).toBeVisible();
  await row.locator(".user-cell").click();
  await expect(page.getByLabel("Имя", { exact: true })).toHaveValue("👩🏽‍💻 Телефон");
  await page.getByRole("combobox", { name: "Флаг", exact: true }).click();
  await page.getByRole("option", { name: "Без флага", exact: true }).click();
  await page.getByRole("button", { name: "Сохранить пользователя", exact: true }).click();
  await expect(row.locator(".avatar img")).toHaveCount(0);
  await expect(row.locator("img.emoji-image")).toHaveAttribute("src", "/emoji/1f469-1f3fd-200d-1f4bb.svg");
  await page.screenshot({ path: info.outputPath("user-emoji.png"), fullPage: true });
});
