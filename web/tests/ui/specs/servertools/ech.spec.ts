import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("ECH generation changes only the draft and exposes public config", async ({ page }, info) => {
  await mockPanel(page);
  await page.route("http://panel.test/api/tools/ech*", (route) =>
    route.fulfill({
      json: {
        keyPath: "/data/ech/test/ech.pem",
        configList: "PUBLIC-CONFIG-ONLY",
        publicName: "public.example.com",
      },
    }),
  );
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByRole("button", { name: "ECH", exact: true }).click();
  await page.getByLabel("Внешнее имя SNI для ECH", { exact: true }).fill("public.example.com");
  await page.getByRole("button", { name: "Создать ключ ECH", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "tls.ech", exact: true })).toHaveValue("PUBLIC-CONFIG-ONLY");
  await expect(page.getByRole("textbox", { name: "ech.keyPath", exact: true })).toHaveValue(
    "/data/ech/test/ech.pem",
  );
  await expect(
    page.getByText("Ключ ECH создан. Сохраните конфигурацию и перезапустите экземпляр.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Внешнее имя SNI для ECH", { exact: true })).toHaveValue("public.example.com");
  await page.getByRole("button", { name: "QUIC parameters", exact: true }).click();
  await page.getByRole("button", { name: "ECH", exact: true }).click();
  await expect(page.getByLabel("Внешнее имя SNI для ECH", { exact: true })).toHaveValue("public.example.com");
  await page.screenshot({ path: info.outputPath("ech-tools.png"), fullPage: true });
});

test("saved ECH public name survives reload without generating another key", async ({ page }) => {
  const { INITIAL_SETTINGS } = await import("../../fixtures/data");
  await mockPanel(page, true, {
    ...INITIAL_SETTINGS,
    config: INITIAL_SETTINGS.config + "ech:\n  keyPath: /data/ech/saved/ech.pem\n",
  });
  let creates = 0;
  await page.route("http://panel.test/api/tools/ech*", async (route) => {
    if (route.request().method() === "POST") creates++;
    await route.fulfill({
      json: {
        keyPath: "/data/ech/saved/ech.pem",
        configList: "PUBLIC-CONFIG-ONLY",
        publicName: "saved.example.com",
      },
    });
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
    await page.getByRole("button", { name: "ECH", exact: true }).click();
    await expect(page.getByLabel("Внешнее имя SNI для ECH", { exact: true })).toHaveValue(
      "saved.example.com",
    );
    await page.getByRole("button", { name: "Получить публичный ECH", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "tls.ech", exact: true })).toHaveValue(
      "PUBLIC-CONFIG-ONLY",
    );
    if (attempt === 0) await page.reload();
  }
  expect(creates).toBe(0);
  await expect(page.getByText(/Happ для Windows 4\.7\.2/)).toHaveCount(0);
});
