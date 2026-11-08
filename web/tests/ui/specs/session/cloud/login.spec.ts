import { expect, test } from "@playwright/test";
import { CLOUD_PASSWORD, MAIN_PASSWORD, mockCloud } from "./fixture";

test("cloud password is a second step and a wrong attempt preserves the form", async ({ page }) => {
  await mockCloud(page);
  await page.getByLabel("Пароль", { exact: true }).fill(MAIN_PASSWORD);
  await page.getByRole("button", { name: "Войти в панель", exact: true }).click();
  await expect(page.getByLabel("Облачный пароль", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ваш сервер", exact: true })).toHaveCount(0);
  await page.getByLabel("Облачный пароль", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  await expect(page.getByText("Неверный облачный пароль", { exact: true })).toBeVisible();
  await page.getByLabel("Облачный пароль", { exact: true }).fill(CLOUD_PASSWORD);
  await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ваш сервер", exact: true })).toBeVisible();
});

test("an expired cloud challenge lets the user restart login", async ({ page }) => {
  const fixture = await mockCloud(page);
  await page.getByLabel("Пароль", { exact: true }).fill(MAIN_PASSWORD);
  await page.getByRole("button", { name: "Войти в панель", exact: true }).click();
  await expect(page.getByLabel("Облачный пароль", { exact: true })).toBeVisible();
  fixture.expireChallenge();
  await page.getByLabel("Облачный пароль", { exact: true }).fill(CLOUD_PASSWORD);
  await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  await expect(
    page.getByText("Запрос входа истёк. Вернитесь к вводу логина и пароля", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Вернуться к входу", exact: true }).click();
  await expect(page.getByLabel("Пароль", { exact: true })).toHaveValue("");
});
