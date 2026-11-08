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
  if (info.project.name === "desktop") expect((await page.locator(".firewall-port-row").first().boundingBox())!.height).toBeLessThanOrEqual(112);
  await expect(page.getByText("sudo ufw status numbered", { exact: true })).toBeHidden();
  await page.getByText("Открытие портов и отмена правил", { exact: true }).click();
  await expect(page.getByText("sudo ufw status numbered", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Проверить UFW", exact: true }).click();
  await page.getByLabel("Порт", { exact: true }).fill("8088");
  await page.getByRole("button", { name: "Применить правило", exact: true }).click();
  await expect.poll(() => applied).toEqual({ port: 8088, protocol: "tcp", action: "allow" });
  await page.screenshot({ path: info.outputPath("firewall-guide.png"), fullPage: true });
});

test("shared ports are grouped and commands have contrast, copy and a manual fallback", async ({ page }, info) => {
  await mockPanel(page);
  await page.route("http://panel.test/api/firewall/ports", route => route.fulfill({ json: { ports: [
    { port: 80, protocol: "tcp", purpose: "acme-http", source: "HY2-P", pending: false },
    { port: 80, protocol: "tcp", purpose: "acme-http", source: "Основной", pending: false },
    { port: 80, protocol: "tcp", purpose: "acme-http", source: "Запасной", pending: false },
    { port: 61254, protocol: "udp", purpose: "vpn", source: "Основной", pending: false },
  ], warnings: [] } }));
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  const guide = page.getByRole("region", { name: "Какие порты открыть", exact: true });
  await expect(guide.locator(".firewall-port-row")).toHaveCount(2);
  const row = guide.locator(".firewall-port-row").first();
  await expect(row).toContainText("HY2-P, Основной, Запасной");
  const command = row.locator(".command-block");
  const commandHeight = (await command.boundingBox())!.height;
  expect(await command.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(await row.evaluate(element => getComputedStyle(element).backgroundColor));
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: async (text: string) => { document.body.dataset.copied = text; } }, configurable: true }));
  await command.getByRole("button").click();
  expect(await page.evaluate(() => document.body.dataset.copied)).toBe("sudo ufw insert 1 allow 80/tcp");
  await expect(page.getByText("Скопировано", { exact: true })).toBeVisible();
  expect((await command.boundingBox())!.height).toBe(commandHeight);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => { throw new Error("clipboard denied"); } } }));
  await command.getByRole("button").click();
  await expect(page.getByText("Выделите команду и скопируйте вручную", { exact: true })).toBeVisible();
  expect(await guide.evaluate(element => element.scrollWidth - element.clientWidth)).toBe(0);
  await guide.screenshot({ path: info.outputPath("grouped-ports.png") });
});
