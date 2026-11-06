import { test, expect } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("SNI follows the address only while linked", async ({ page }) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  const host = page.getByLabel("Публичный адрес", { exact: true });
  const sni = page.getByLabel("SNI", { exact: true });
  const link = page.getByRole("checkbox", { name: "SNI совпадает с адресом", exact: true });
  await expect(link).toBeChecked();
  await host.fill("new.example.org");
  await expect(sni).toHaveValue("new.example.org");
  await expect(sni).toBeDisabled();
  await link.uncheck();
  await sni.fill("certificate.example.org");
  await host.fill("server.example.org");
  await expect(sni).toHaveValue("certificate.example.org");
  await link.check();
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect.poll(() => panel.saved().sni).toBe("server.example.org");
});

test("documented properties are searchable and outbounds have fields", async ({ page }) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  const search = page.getByRole("searchbox", { name: "Найти свойство", exact: true });
  await search.fill("disableUDP");
  await page.getByLabel("disableUDP", { exact: true }).click();
  await page.getByRole("option", { name: "false", exact: true }).click();
  await search.fill("realm.ipMode");
  await expect(page.getByLabel("realm.ipMode", { exact: true })).toBeVisible();
  await search.fill("trafficStats.secret");
  await expect(page.getByLabel("trafficStats.secret", { exact: true })).toBeDisabled();
  await search.fill("outbounds");
  await page.getByRole("button", { name: "Добавить исходящее подключение", exact: true }).click();
  await page.getByLabel("outbounds[0].type", { exact: true }).click();
  await page.getByRole("option", { name: "socks5", exact: true }).click();
  await page.getByLabel("outbounds[0].socks5.addr", { exact: true }).fill("127.0.0.1:1080");
  await page.getByLabel("outbounds[0].socks5.password", { exact: true }).fill("a");
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect.poll(() => panel.saved().config).toContain("127.0.0.1:1080");
  expect(panel.saved().config).toContain("disableUDP: false");
});
test("configuration sections preserve edits on desktop and mobile", async ({ page }, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByLabel("listen", { exact: true }).fill(":61254");
  for (const title of ["QUIC parameters", "Listen"]) {
    if (info.project.name === "mobile") {
      await page.getByRole("combobox", { name: "Раздел конфигурации", exact: true }).click();
      await page.getByRole("option", { name: title, exact: true }).click();
    } else {
      await page
        .getByRole("navigation", { name: "Разделы конфигурации" })
        .getByRole("button", { name: title, exact: true })
        .click();
    }
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  }
  await expect(page.getByLabel("listen", { exact: true })).toHaveValue(":61254");
  await expect(page.getByLabel("listen", { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("configuration-navigation.png"), fullPage: true });
});
test("keyboard selection, resets and saving produce clean ordered YAML", async ({ page }, info) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByRole("searchbox", { name: "Найти свойство" }).fill("congestion.type");
  const congestion = page.getByLabel("congestion.type", { exact: true });
  await congestion.click();
  await page.getByRole("option", { name: "reno", exact: true }).click();
  await page.getByRole("button", { name: "Сбросить congestion.type", exact: true }).click();
  await page.getByRole("searchbox", { name: "Найти свойство" }).fill("speedTest");
  const speed = page.getByLabel("speedTest", { exact: true });
  await speed.focus();
  await speed.press("Enter");
  await expect(page.getByRole("option", { name: "true", exact: true })).toBeFocused();
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

test("configuration can be applied without leaving the page", async ({ page }) => {
  const panel = await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByRole("searchbox", { name: "Найти свойство" }).fill("speedTest");
  await page.getByLabel("speedTest", { exact: true }).click();
  await page.getByRole("option", { name: "false", exact: true }).click();
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(page.getByText("Конфигурация сохранена", { exact: true })).toBeVisible();
  expect(panel.coreActions).toEqual([]);
  await page.getByRole("button", { name: "Перезапустить ядро", exact: true }).click();
  await expect.poll(() => panel.coreActions).toEqual(["restart"]);
  await expect(page.getByText("Конфигурация сохранена", { exact: true })).toHaveCount(0);
});
