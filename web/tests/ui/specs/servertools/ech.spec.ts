import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("ECH generation changes only the draft and exposes public config", async ({ page }, info) => {
  await mockPanel(page);
  await page.route("http://panel.test/api/tools/ech", (route) =>
    route.fulfill({ json: { keyPath: "/data/ech/test/ech.pem", configList: "PUBLIC-CONFIG-ONLY" } }),
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
  await page.screenshot({ path: info.outputPath("ech-tools.png"), fullPage: true });
});
