import { type Page } from "@playwright/test";
import { mockPanel } from "../../fixtures";

export async function mockSession(page: Page, isAuthorized = false) {
  await mockPanel(page, isAuthorized);
  await page.route("http://panel.test/api/**", async (route) => {
    const endpoint = new URL(route.request().url()).pathname;
    if (endpoint === "/api/login") {
      isAuthorized = true;
      await route.fulfill({ json: { ok: true } });
    } else if (endpoint === "/api/logout") {
      isAuthorized = false;
      await route.fulfill({ json: { ok: true } });
    } else if (!isAuthorized) {
      await route.fulfill({ status: 401, json: { error: "Нужен вход" } });
    } else if (endpoint === "/api/session") {
      await route.fulfill({ json: { ok: true } });
    } else {
      await route.fallback();
    }
  });
  await page.reload();
  return {
    expire: () => {
      isAuthorized = false;
    },
  };
}
