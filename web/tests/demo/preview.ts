import { type Page } from "@playwright/test";
import path from "node:path";
export async function previewDemo(page: Page) {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "https://demo.test" || url.pathname.startsWith("/api") || url.pathname.startsWith("/sub")) {
      requests.push(url.pathname);
      await route.abort();
      return;
    }
    await route.fulfill({ path: path.resolve("dist-demo", url.pathname === "/" ? "index.html" : url.pathname.slice(1)) });
  });
  await page.goto("https://demo.test");
  await page.getByRole("heading", { name: "Ваш сервер", exact: true }).waitFor();
  return { requests, errors };
}
