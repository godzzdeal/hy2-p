import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("firewall status and port rule use the protected API", async ({ page }, info) => {
  await mockPanel(page);
  await page.route("http://panel.test/api/firewall/ports", (route) =>
    route.fulfill({
      json: {
        ports: [
          { port: 9443, protocol: "tcp", purpose: "panel", source: "HY2-P", pending: false },
          { port: 61254, protocol: "udp", purpose: "vpn", source: "Main", pending: false },
        ],
        warnings: [],
      },
    }),
  );
  let applied: unknown;
  await page.route("http://panel.test/api/firewall", (route) => {
    if (route.request().method() === "POST") applied = route.request().postDataJSON();
    return route.fulfill({ json: { active: true, output: "Status: active\n8088/tcp ALLOW IN Anywhere" } });
  });
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect(page.getByText("sudo ufw insert 1 allow 61254/udp", { exact: true })).toBeVisible();
  await expect(page.getByText("sudo ufw insert 1 allow 9443/tcp", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Проверить UFW", exact: true }).click();
  await page.getByLabel("Порт", { exact: true }).fill("8088");
  await page.getByRole("button", { name: "Применить правило", exact: true }).click();
  await expect.poll(() => applied).toEqual({ port: 8088, protocol: "tcp", action: "allow" });
  await page.screenshot({ path: info.outputPath("firewall-guide.png"), fullPage: true });
});
