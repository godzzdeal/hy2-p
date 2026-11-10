import { expect, test } from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";
import { INITIAL_SETTINGS, WEB_SETTINGS } from "../../fixtures/data";

test("settings collapse keeps drafts, remembers state and leaves room for fixed bars", async ({
  page,
}, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  const account = page.locator("#panel-account");
  const toggle = account.getByRole("button", { name: "Учётная запись администратора", exact: true });
  await expect(page.locator('.settings-toggle[aria-expanded="true"]')).toHaveCount(0);
  await toggle.click();
  await account.getByLabel("Логин", { exact: true }).fill("draft-name");
  await toggle.click();
  await expect(account.getByLabel("Логин", { exact: true })).toBeHidden();
  await toggle.click();
  await expect(account.getByLabel("Логин", { exact: true })).toHaveValue("draft-name");
  await toggle.click();
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  const header = await page.locator(".app-header").boundingBox();
  await page.locator(".content").evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await expect.poll(async () => (await page.locator(".app-header").boundingBox())!.y).toBe(header!.y);
  const footer = await page.getByRole("contentinfo").boundingBox();
  const borders = await page.getByRole("contentinfo").evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
  });
  expect(borders).toEqual(["1px", "0px", "0px", "0px"]);
  const last = await page.locator("#panel-firewall").boundingBox();
  expect(last!.y + last!.height).toBeLessThanOrEqual(footer!.y);
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  if (info.project.name === "mobile") {
    const navigation = (await page.locator(".scroll-navigation").boundingBox())!;
    const content = (await page.locator(".content").boundingBox())!;
    expect(navigation.y).toBeGreaterThanOrEqual(content.y + content.height);
    expect(navigation.y + navigation.height).toBeLessThanOrEqual(footer!.y);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("fixed-bars.png") });
});

test("passwords use a single input with a reversible visibility toggle", async ({ page }) => {
  await mockPanel(page, false);
  const password = page.getByLabel("Пароль", { exact: true });
  await password.fill("fixture-private-password");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Показать пароль", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("fixture-private-password");
  await page.getByRole("button", { name: "Скрыть пароль", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(page.locator(".generated-password")).toHaveCount(0);
});

test("section navigation keeps the header and footer fixed", async ({ page }) => {
  await mockPanel(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  const header = (await page.locator(".app-header").boundingBox())!.y;
  const footer = (await page.getByRole("contentinfo").boundingBox())!.y;
  await page.getByRole("button", { name: "Перейти к разделу Firewall", exact: true }).click();
  await expect
    .poll(() => page.locator(".content").evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect((await page.locator(".app-header").boundingBox())!.y).toBe(header);
  expect((await page.getByRole("contentinfo").boundingBox())!.y).toBe(footer);
});

test("HTTP requires no domain and ACME accepts an IP in the form", async ({ page }, info) => {
  await mockPanel(page);
  let saved: unknown;
  await page.route("http://panel.test/api/admin/web", async (route) => {
    if (route.request().method() === "PUT") saved = route.request().postDataJSON();
    await route.fulfill({
      json: saved ? { ...WEB_SETTINGS, config: saved, restartRequired: true } : WEB_SETTINGS,
    });
  });
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  const network = page.locator("#panel-network");
  await network.getByRole("button", { name: "Порт, домен и HTTPS веб-панели", exact: true }).click();
  await expect(network.getByLabel("Домен или IP веб-панели", { exact: true })).toHaveCount(0);
  await network
    .getByLabel("Публичный URL панели и подписок", { exact: true })
    .fill("http://203.0.113.10:9443");
  await network.getByRole("button", { name: "Сохранить настройки веб-панели", exact: true }).click();
  expect(saved).toMatchObject({ mode: "http", domain: "", publicURL: "http://203.0.113.10:9443" });
  await network.getByRole("combobox", { name: "HTTPS веб-панели", exact: true }).click();
  await page.getByRole("option", { name: "HTTPS с автоматическим сертификатом", exact: true }).click();
  await network.getByLabel("Домен или IP веб-панели", { exact: true }).fill("8.8.8.8");
  await network.getByLabel("Email для Let's Encrypt", { exact: true }).fill("test@example.com");
  await network.getByRole("checkbox", { name: "Принимаю условия Let's Encrypt", exact: true }).check();
  await network.getByRole("button", { name: "Сохранить настройки веб-панели", exact: true }).click();
  expect(saved).toMatchObject({ mode: "acme", domain: "8.8.8.8", acceptedTerms: true });
  await network.screenshot({ path: info.outputPath("ip-certificate.png") });
});

test("a new instance reuses the panel address while custom addresses remain editable", async ({ page }) => {
  await mockPanel(page, true, { ...INITIAL_SETTINGS, host: "", sni: "" });
  await page.route("http://panel.test/api/admin/web", (route) =>
    route.fulfill({
      json: {
        ...WEB_SETTINGS,
        config: { ...WEB_SETTINGS.config, domain: "panel.example.com", email: "owner@example.com" },
      },
    }),
  );
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await expect(page.getByLabel("Публичный адрес", { exact: true })).toHaveValue("panel.example.com");
  await expect(page.getByLabel("SNI", { exact: true })).toHaveValue("panel.example.com");
  await page.getByLabel("Публичный адрес", { exact: true }).fill("");
  await expect(page.getByLabel("Публичный адрес", { exact: true })).toHaveValue("");
  await page.getByLabel("Публичный адрес", { exact: true }).fill("custom.example.com");
  await expect(page.getByLabel("SNI", { exact: true })).toHaveValue("custom.example.com");
  await page.getByRole("button", { name: "TLS / ACME", exact: true }).click();
  await page.getByRole("combobox", { name: "Сертификат Hysteria2", exact: true }).click();
  await page.getByRole("option", { name: "Автоматический сертификат ACME", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "acme.domains", exact: true })).toHaveValue(
    "custom.example.com",
  );
  await expect(page.getByRole("textbox", { name: "acme.email", exact: true })).toHaveValue(
    "owner@example.com",
  );
});
