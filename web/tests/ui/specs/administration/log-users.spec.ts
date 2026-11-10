import { expect, test } from "@playwright/test";
import { chooseTheme, mockPanel } from "../../fixtures";

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

test("log controls share a height with plain, decorated and long user names", async ({ page }, info) => {
  await mockPanel(page);
  const users = [
    { id: "a".repeat(16), name: "Алексей", displayName: "Алексей" },
    { id: "b".repeat(16), name: "Мария", displayName: "🇳🇱 🚀 Мария" },
    {
      id: "c".repeat(16),
      name: "Очень длинное имя сотрудника из регионального подразделения",
      displayName: "🇩🇪 🛰️ Очень длинное имя сотрудника из регионального подразделения",
    },
  ];
  await page.route("http://panel.test/api/users", (route) =>
    route.fulfill({ json: users.map((user) => ({ ...user, enabled: true, expires: "", created: "" })) }),
  );
  await page.reload();
  for (const theme of [
    { label: "Светлая", value: "light" },
    { label: "Тёмная", value: "dark" },
  ]) {
    await chooseTheme(page, theme);
    await page.getByRole("button", { name: "Управление HY2", exact: true }).click();
    const toolbar = page.locator(".log-toolbar");
    const filter = toolbar.getByRole("button", { name: "Пользователь в журнале", exact: true });
    for (const [index, user] of [undefined, ...users].entries()) {
      await filter.click();
      const picker = page.getByRole("dialog", { name: "Выбрать пользователя", exact: true });
      if (user) await picker.locator(".log-user-option").filter({ hasText: user.name }).click();
      else await picker.getByRole("button", { name: "Все пользователи", exact: true }).click();
      const controls = await toolbar.locator(":scope > input, :scope > button").evaluateAll((elements) =>
        elements.map((element) => ({
          height: element.getBoundingClientRect().height,
          target: parseFloat(getComputedStyle(element).getPropertyValue("--control-height")),
          overflowX: element.scrollWidth - element.clientWidth,
          overflowY: element.scrollHeight - element.clientHeight,
        })),
      );
      expect(controls).toHaveLength(6);
      for (const control of controls) {
        expect(control.height).toBe(control.target);
        expect(control.overflowX).toBeLessThanOrEqual(0);
        expect(control.overflowY).toBeLessThanOrEqual(0);
      }
      const iconInsets = await toolbar
        .locator(".select-trigger, .log-user-trigger")
        .evaluateAll((elements) =>
          elements.map(
            (element) =>
              element.getBoundingClientRect().right -
              element.querySelector("svg:last-child")!.getBoundingClientRect().right,
          ),
        );
      expect(iconInsets[0]).toBe(iconInsets[1]);
      expect(await toolbar.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0);
      if (info.project.name === "mobile") {
        const level = (await toolbar.getByRole("combobox").boundingBox())!;
        const user = (await filter.boundingBox())!;
        expect(level.x).toBe(user.x);
        expect(user.y).toBeGreaterThanOrEqual(level.y + level.height + 4);
        expect(Math.abs(level.width - user.width)).toBeLessThanOrEqual(1);
      }
      await toolbar.screenshot({ path: info.outputPath("toolbar-" + theme.value + "-" + index + ".png") });
    }
    await page.getByRole("button", { name: "Обзор", exact: true }).click();
  }
});
