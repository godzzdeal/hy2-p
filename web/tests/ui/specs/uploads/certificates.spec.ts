import { expect, test } from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";
import { dropFiles } from "./drop";

test("certificate pins are client settings and can follow the certificate automatically", async ({page},info) => {
  const panel = await mockPanel(page);
  const pin = "ab".repeat(32);
  await page.route("http://panel.test/api/certificates/hysteria",route => route.fulfill({json:{mode:"tls",automaticRenewal:false,certificates:[],pinSHA256:pin,pinError:""}}));
  await page.getByRole("button",{name:"Конфигурация",exact:true}).click();
  const input = page.getByRole("textbox",{name:"pinSHA256",exact:true});
  await expect(input).toBeVisible();
  await expect(page.locator("#config-fields").getByRole("textbox",{name:"pinSHA256",exact:true})).toHaveCount(0);
  await input.fill("cd".repeat(32));
  await page.getByRole("checkbox",{name:"Вычислять по сертификату",exact:true}).check();
  await expect(input).toHaveValue(pin);
  await expect(input).toHaveAttribute("readonly","");
  await page.getByRole("button",{name:"Сохранить конфигурацию",exact:true}).click();
  await expect.poll(()=>panel.saved().pinFromCertificate).toBe(true);
  expect(panel.saved().pinSHA256).toBe("");
  expect(panel.saved().config).not.toContain("pinSHA256");
  await page.screenshot({path:info.outputPath("certificate-pin.png")});
});

test("HY2 certificate fields share the drop zone and preserve the upload payload", async ({ page }, info) => {
  await mockPanel(page);
  let uploaded: unknown;
  await page.route("http://panel.test/api/certificates/hysteria", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    uploaded = route.request().postDataJSON();
    await route.fulfill({
      json: {
        certificatePath: "/data/upload/cert.pem",
        keyPath: "/data/upload/key.pem",
        notAfter: "2027-01-01",
      },
    });
  });
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
  await page.getByRole("button", { name: "TLS / ACME", exact: true }).click();
  const certificate = page.getByRole("button", { name: "Выбрать файл: Сертификат PEM", exact: true });
  const key = page.getByRole("button", { name: "Выбрать файл: Приватный ключ PEM", exact: true });
  await dropFiles(certificate, [
    { name: "server.pem", type: "application/x-pem-file", text: "fixture-public-certificate" },
  ]);
  await dropFiles(key, [
    { name: "server.key", type: "application/octet-stream", text: "fixture-private-key" },
  ]);
  await page.getByRole("button", { name: "Загрузить сертификат", exact: true }).click();
  await expect
    .poll(() => uploaded)
    .toEqual({ certificate: "fixture-public-certificate", privateKey: "fixture-private-key" });
  await expect(page.getByRole("textbox", { name: "tls.cert", exact: true })).toHaveValue(
    "/data/upload/cert.pem",
  );
  await expect(page.getByRole("textbox", { name: "tls.key", exact: true })).toHaveValue(
    "/data/upload/key.pem",
  );
  await page.getByRole("button", { name: "Сохранить конфигурацию", exact: true }).click();
  await expect(page.locator(".draft-bar")).toHaveCount(0);
  await certificate.screenshot({ path: info.outputPath("tls-upload.png") });
  await key.screenshot({ path: info.outputPath("key-upload.png") });
});

test("panel certificate upload rejects oversized files and keeps its layout within the card", async ({
  page,
}, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  const network = page.locator("#panel-network");
  await network.getByRole("combobox", { name: "HTTPS веб-панели", exact: true }).click();
  await page.getByRole("option", { name: "HTTPS со своим сертификатом", exact: true }).click();
  const zone = network.getByRole("button", { name: "Выбрать файл: Сертификат веб-панели PEM", exact: true });
  await dropFiles(zone, [
    { name: "large.pem", type: "application/x-pem-file", text: "x".repeat(1024 * 1024 + 1) },
  ]);
  await expect(page.getByRole("alert")).toContainText("Файл сертификата слишком большой");
  await dropFiles(zone, [{ name: "valid.pem", type: "application/x-pem-file", text: "fixture-certificate" }]);
  await expect(zone).toContainText("valid.pem");
  const bounds = (await network.boundingBox())!;
  for (const button of await network.locator(".file-dropzone").all()) {
    const box = (await button.boundingBox())!;
    expect(box.x - bounds.x).toBeGreaterThanOrEqual(16);
    expect(bounds.x + bounds.width - box.x - box.width).toBeGreaterThanOrEqual(16);
  }
  expect(await network.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await zone.screenshot({ path: info.outputPath("panel-certificate-upload.png") });
});
