import { type Page } from "@playwright/test";
const FRONTEND = process.env.PLAYWRIGHT_DEMO_URL ?? "http://127.0.0.1:3001";
export async function previewDemo(page: Page) {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(FRONTEND).origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/sub/")) {
      requests.push(url.pathname);
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.goto(FRONTEND);
  await page.getByRole("heading", { name: "Ваш сервер", exact: true }).waitFor();
  return { requests, errors };
}
