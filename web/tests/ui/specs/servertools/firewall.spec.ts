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
  await expect(
    page.getByRole("button", { name: "Скопировать команду для 61254/udp", exact: true }),
  ).toHaveAttribute("title", "sudo ufw insert 1 allow 61254/udp");
  await expect(
    page.getByRole("button", { name: "Скопировать команду для 9443/tcp", exact: true }),
  ).toHaveAttribute("title", "sudo ufw insert 1 allow 9443/tcp");
  expect((await page.locator(".firewall-port-row").first().boundingBox())!.height).toBeLessThanOrEqual(80);
  await expect(page.locator(".firewall-example")).toBeHidden();
  await page.getByText("Открытие портов и отмена правил", { exact: true }).click();
  await expect(page.locator(".firewall-example")).toBeVisible();
  await page.getByRole("button", { name: "Проверить UFW", exact: true }).click();
  await page.getByLabel("Порт", { exact: true }).fill("8088");
  await page.getByRole("button", { name: "Применить правило", exact: true }).click();
  await expect.poll(() => applied).toEqual({ port: 8088, protocol: "tcp", action: "allow" });
  await page.screenshot({ path: info.outputPath("firewall-guide.png"), fullPage: true });
});
