import { test, expect } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("firewall status and port rule use the protected API", async ({ page }) => {
  await mockPanel(page);
  let applied: unknown;
  await page.route("http://panel.test/api/firewall", (route) => {
    if (route.request().method() === "POST") applied = route.request().postDataJSON();
    return route.fulfill({ json: { active: true, output: "Status: active\n8088/tcp ALLOW IN Anywhere" } });
  });
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await page.getByRole("button", { name: "Проверить UFW", exact: true }).click();
  await page.getByLabel("Порт", { exact: true }).fill("8088");
  await page.getByRole("button", { name: "Применить правило", exact: true }).click();
  await expect.poll(() => applied).toEqual({ port: 8088, protocol: "tcp", action: "allow" });
});
