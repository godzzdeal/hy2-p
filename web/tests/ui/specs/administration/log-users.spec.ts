import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";

test("log client IDs resolve to users and device IDs and can be filtered", async ({ page }, info) => {
  await mockPanel(page);
  const first = "a".repeat(16),
    second = "b".repeat(16);
  await page.route("http://panel.test/api/users", (route) =>
    route.fulfill({
      json: [
        { id: first, name: "Алексей", enabled: true, expires: "", created: "" },
        { id: second, name: "Мария", enabled: true, expires: "", created: "" },
      ],
    }),
  );
  const logs = `2026-11-10 INFO client connected {"id":"${first}"}\n2026-11-10 WARN TCP error {"id":"${first}.${"c".repeat(32)}.${"d".repeat(16)}"}\n2026-11-10 INFO client connected {"id":"${second}"}\n2026-11-10 INFO server up and running`;
  await page.route("http://panel.test/api/core", (route) =>
    route.fulfill({ json: { available: true, running: true, binary: "hysteria", logs } }),
  );
  await page.reload();
  await page.getByRole("button", { name: "Управление HY2", exact: true }).click();
  const region = page.getByRole("region", { name: "Сообщения экземпляра", exact: true });
  await expect(region.locator(".log-client")).toHaveCount(3);
  await expect(region).toContainText("Устройство: cccccccc");
  await page.getByRole("button", { name: "Пользователь в журнале", exact: true }).click();
  const picker = page.getByRole("dialog", { name: "Выбрать пользователя", exact: true });
  await picker.getByRole("button", { name: "Алексей", exact: true }).click();
  await expect(region.locator(".log-line")).toHaveCount(2);
  await expect(region).not.toContainText("Мария");
  await page.getByRole("searchbox", { name: "Поиск в журнале", exact: true }).fill("Алексей");
  await expect(region.locator(".log-line")).toHaveCount(2);
  await page.getByRole("combobox", { name: "Уровень сообщений", exact: true }).click();
  await page.getByRole("option", { name: "Предупреждения", exact: true }).click();
  await expect(region.locator(".log-line")).toHaveCount(1);
  await expect(region).toContainText("TCP error");
  const toolbar = page.locator(".log-toolbar");
  expect(await toolbar.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("user-log-filter.png") });
});
