import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { prepareScreenshots } from "./fixture";
import { MACOS_WINDOW } from "./window";

export async function captureScreenshots(): Promise<void> {
  const output = path.resolve("../docs/images");
  const version = (await readFile(path.resolve("../internal/buildinfo/VERSION"), "utf8")).trim();
  const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
  try {
    const context = await browser.newContext({
      viewport: { width: 1536, height: 936 },
      deviceScaleFactor: 1,
      colorScheme: "dark",
      locale: "ru-RU",
      timezoneId: "Europe/Moscow",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => {
      // Switching from the fixture page to the framed preview cancels pending queries.
      if (request.failure()?.errorText !== "net::ERR_ABORTED") errors.push(request.url());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(response.url());
    });
    await prepareScreenshots(page, version);
    await page.reload();
    const app = page;
    await app.getByRole("link", { name: "Обзор", exact: true }).click();
    await app.getByRole("heading", { name: "Ваш сервер", exact: true }).waitFor();
    await app.locator("body").evaluate(() => document.fonts.ready);
    await mkdir(output, { recursive: true });
    await page.mouse.move(800, 52);
    await saveScreenshot("overview.png");
    await app.getByRole("link", { name: "Пользователи", exact: true }).click();
    await app.locator(".group-users tr").first().waitFor();
    await page.mouse.move(800, 52);
    await saveScreenshot("users.png");
    await page.emulateMedia({ colorScheme: "light" });
    await app.getByRole("link", { name: "Конфигурация", exact: true }).click();
    await app.getByRole("button", { name: "QUIC parameters", exact: true }).click();
    await app.getByLabel("quic.maxIdleTimeout", { exact: true }).waitFor();
    await app.locator(".content").evaluate((content) => {
      const target = content.querySelector(".config-technical-toggle")!;
      content.scrollTop += target.getBoundingClientRect().top - content.getBoundingClientRect().top;
    });
    await page.mouse.move(800, 52);
    const geometry = await app
      .locator("body")
      .evaluate(() => ({
        viewport: innerHeight,
        scrollY,
        header: document.querySelector(".app-header")!.getBoundingClientRect().top,
        footer: document.querySelector(".panel-footer")!.getBoundingClientRect().bottom,
      }));
    if (geometry.scrollY !== 0 || geometry.header !== 0 || Math.abs(geometry.footer - geometry.viewport) > 1)
      throw new Error("Screenshot bars moved: " + JSON.stringify(geometry));
    await saveScreenshot("configuration.png");
    if (errors.length) throw new Error("Screenshot resources failed: " + errors.join(", "));
    console.log("Updated macOS screenshots:", output);
    async function saveScreenshot(name: string): Promise<void> {
      const screenshot = await page.screenshot();
      const frame = await context.newPage();
      await frame.setViewportSize({ width: 1600, height: 1040 });
      await frame.setContent(MACOS_WINDOW.replace("SCREENSHOT", "data:image/png;base64," + screenshot.toString("base64")));
      await frame.locator("img").evaluate((image: HTMLImageElement) => image.decode());
      await frame.screenshot({ path: path.join(output, name) });
      await frame.close();
    }
  } finally {
    await browser.close();
  }
}
