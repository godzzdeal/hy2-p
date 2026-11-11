import { type Page } from "@playwright/test";
import { mockPanel } from "../../../fixtures";

export const MAIN_PASSWORD = "main-password-only";
export const CLOUD_PASSWORD = "cloud-password-only";
export async function mockCloud(page: Page, isEnabled = true, isAuthorized = false) {
  await mockPanel(page, isAuthorized);
  let password = CLOUD_PASSWORD;
  let challenge = "";
  let counter = 0;
  await page.route("**/api/**", async (route) => {
    const endpoint = new URL(route.request().url()).pathname;
    if (endpoint === "/api/login") {
      if (isEnabled) {
        challenge = "fixture-challenge-" + ++counter;
        return route.fulfill({ json: { ok: false, cloudPasswordRequired: true, challenge } });
      }
      isAuthorized = true;
      return route.fulfill({ json: { ok: true } });
    }
    if (endpoint === "/api/login/cloud") {
      const body = route.request().postDataJSON() as { challenge: string; password: string };
      if (!challenge || body.challenge !== challenge)
        return route.fulfill({
          status: 410,
          json: { error: "Запрос входа истёк. Вернитесь к вводу логина и пароля" },
        });
      if (body.password !== password)
        return route.fulfill({ status: 401, json: { error: "Неверный облачный пароль" } });
      isAuthorized = true;
      challenge = "";
      return route.fulfill({ json: { ok: true } });
    }
    if (!isAuthorized) return route.fulfill({ status: 401, json: { error: "Нужен вход" } });
    if (endpoint === "/api/session") return route.fulfill({ json: { ok: true } });
    if (endpoint === "/api/admin/cloud-password") {
      if (route.request().method() === "PUT") {
        const body = route.request().postDataJSON() as {
          currentPassword: string;
          currentCloudPassword: string;
          password: string;
        };
        if (body.currentPassword !== MAIN_PASSWORD || (isEnabled && body.currentCloudPassword !== password))
          return route.fulfill({ status: 400, json: { error: "Неверный облачный пароль" } });
        password = body.password;
        isEnabled = !!password;
        isAuthorized = false;
        return route.fulfill({ json: { loginRequired: true } });
      }
      return route.fulfill({ json: { enabled: isEnabled } });
    }
    await route.fallback();
  });
  await page.reload();
  return {
    enabled: () => isEnabled,
    expireChallenge: () => {
      challenge = "";
    },
  };
}
export async function signIn(page: Page, cloudPassword?: string) {
  await page.getByLabel("Логин", { exact: true }).fill("admin");
  await page.getByLabel("Пароль", { exact: true }).fill(MAIN_PASSWORD);
  await page.getByRole("button", { name: "Войти в панель", exact: true }).click();
  if (cloudPassword) {
    await page.getByLabel("Облачный пароль", { exact: true }).fill(cloudPassword);
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  }
}
