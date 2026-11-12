import { expect, test } from "@playwright/test";
import { chooseTheme, mockPanel, waitForAppearance } from "../../fixtures";
import { expectAligned } from "./fixture";
import { readdir } from "node:fs/promises";
import path from "node:path";

test("the production build includes every local emoji and flag", async () => {
  for (const [source, destination] of [
    ["node_modules/@twemoji/svg", "public/emoji"],
    ["node_modules/flag-icons/flags/4x3", "public/flags"],
  ]) {
    const [originals, packaged] = await Promise.all([
      readdir(path.resolve(source)),
      readdir(path.resolve(destination)),
    ]);
    const assets = new Set(packaged);
    expect(originals.filter((file) => file.endsWith(".svg") && !assets.has(file))).toEqual([]);
  }
});

test("log flags emoji and names share one line without overflowing", async ({ page }, info) => {
  await mockPanel(page);
  const id = "a".repeat(16);
  const identity = id + "." + "b".repeat(32) + "." + "c".repeat(16);
  await page.route("**/api/users", (route) =>
    route.fulfill({ json: [{ id, name: "godzz", displayName: "🇳🇱 🚀 godzz", enabled: true }] }),
  );
  await page.route("**/api/core", (route) =>
    route.fulfill({
      json: {
        available: true,
        running: true,
        binary: "hysteria",
        logs: "2026-11-10T14:00:00Z INFO client connected " + JSON.stringify({ id: identity }),
      },
    }),
  );
  // Register mock users before a fresh query cache is populated.
  await page.reload();
  for (const choice of [
    { label: "Светлая", value: "light" },
    { label: "Тёмная", value: "dark" },
  ]) {
    await chooseTheme(page, choice);
    await page.getByRole("link", { name: "Управление HY2", exact: true }).click();
    const client = page.locator(".log-client");
    await expect(client).toContainText("godzz");
    await expectAligned(client.locator(".country-flag"), client.locator(".emoji-image"));
    await expectAligned(client.locator(".emoji-image"), client.locator(".emoji-text > span").last());
    expect(await client.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await client.screenshot({ path: info.outputPath("log-client-" + choice.value + ".png") });
    await page.getByRole("link", { name: "Обзор", exact: true }).click();
  }
});

test("English loads on demand and a saved language survives reload", async ({ page }) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/_next/static/") && request.url().endsWith(".js")) requests++;
  });
  await mockPanel(page);
  await expect(page.getByRole("heading", { name: "Ваш сервер", exact: true })).toBeVisible();
  const initialRequests = requests;
  const language = page.locator(".language-control");
  await waitForAppearance(page);
  await language.click();
  await page.getByRole("menuitemradio", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(requests).toBeGreaterThan(initialRequests);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".app-sidebar")).toContainText("Overview");
  await expect(page.locator(".startup-loader")).toHaveCount(0);
});

test("a missing English chunk falls back to a usable panel", async ({ page }) => {
  await mockPanel(page);
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await waitForAppearance(page);
  await page.locator(".language-control").click();
  await page.getByRole("menuitemradio", { name: "English", exact: true }).click();
  await expect(page.getByRole("link", { name: "Пользователи", exact: true })).toBeEnabled();
  await page.unroute("**/_next/static/**/*.js");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Пользователи", exact: true })).toBeEnabled();
});
