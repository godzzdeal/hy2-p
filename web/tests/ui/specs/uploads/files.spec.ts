import { expect, test, type Download } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expandSettings, mockPanel } from "../../fixtures";
import { dropFiles } from "./drop";

const YAML = "listen: :62000\ntls:\n  cert: /certs/server.crt\n  key: /certs/server.key\n";

async function downloadedFile(download: Download, suffix: string, hostname: string) {
  const path = await download.path();
  if (!path) throw new Error("Download file was not saved");
  const buffer = await readFile(path);
  const fingerprint = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const name = download.suggestedFilename();
  expect(name.startsWith(hostname + "_")).toBe(true);
  expect(name.slice(hostname.length + 1)).toMatch(/^\d{8}T\d{6}\.\d{3}Z_/);
  expect(name.endsWith("_" + fingerprint + "_" + suffix)).toBe(true);
  return { name, buffer };
}

test("downloads have server/time/content identity and exports can be imported with the full name", async ({
  page,
}, info) => {
  await mockPanel(page);
  const hostname = new URL(page.url()).hostname;
  const bundle = { format: "hy2-p/1", profiles: [], users: [] };
  await page.route("**/api/admin/transfer", (route) => route.fulfill({ json: bundle }));
  let imported: unknown;
  await page.route("**/api/admin/transfer/preview", (route) => {
    imported = route.request().postDataJSON().bundle;
    return route.fulfill({ json: { rows: [], fingerprint: "preview" } });
  });
  await page.getByRole("link", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  const jsonEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспортировать данные", exact: true }).click();
  const file = await downloadedFile(await jsonEvent, "hy2-p.json", hostname);
  await page
    .getByLabel("Файл импорта HY2-P", { exact: true })
    .setInputFiles({ ...file, mimeType: "application/json" });
  await expect.poll(() => imported).toEqual(bundle);
  const zone = page.getByRole("button", { name: "Выбрать файл: Файл импорта HY2-P", exact: true });
  await expect(zone).toContainText(file.name);
  expect(await zone.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await zone.screenshot({ path: info.outputPath("named-file-import.png") });
  await page.getByRole("link", { name: "Управление HY2", exact: true }).click();
  const logEvent = page.waitForEvent("download");
  await page.locator(".log-toolbar").getByRole("button", { name: "Скачать", exact: true }).click();
  await downloadedFile(await logEvent, "hysteria2.log", hostname);
});

test("YAML supports drag feedback, keyboard selection and invalid-file notifications", async ({
  page,
}, info) => {
  await mockPanel(page);
  await page.getByRole("link", { name: "Конфигурация", exact: true }).click();
  const zone = page.getByRole("button", { name: "Выбрать файл: Импорт YAML в черновик", exact: true });
  expect(await zone.evaluate((element) => getComputedStyle(element).borderTopStyle)).toBe("dashed");
  const filename = "конфигурация-для-тестового-сервера-".repeat(6) + ".yaml";
  await dropFiles(zone, [{ name: filename, type: "application/yaml", text: YAML }], async () => {
    await expect(zone).toHaveClass(/file-dropzone-active/);
    await expect(zone).toContainText("Отпустите файл для загрузки");
  });
  await expect(page.getByLabel("Публичный UDP-порт", { exact: true })).toHaveValue("62000");
  await expect(zone).toContainText(filename);
  expect(await zone.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await dropFiles(zone, [{ name: "image.png", type: "image/png", text: "not a config" }]);
  await expect(page.locator(".notifications").getByRole("alert")).toContainText("Неподдерживаемый формат файла");
  await expect(page.getByLabel("Публичный UDP-порт", { exact: true })).toHaveValue("62000");
  await page.getByRole("button", { name: "Закрыть уведомление", exact: true }).last().click();
  const chooser = page.waitForEvent("filechooser");
  await zone.focus();
  await zone.press("Enter");
  await (
    await chooser
  ).setFiles({
    name: "second.yaml",
    mimeType: "application/yaml",
    buffer: Buffer.from(YAML.replace("62000", "62001")),
  });
  await expect(page.getByLabel("Публичный UDP-порт", { exact: true })).toHaveValue("62001");
  await zone.screenshot({ path: info.outputPath("yaml-upload.png") });
});

test("import prevents multiple files and additional drops while a preview is pending", async ({
  page,
}, info) => {
  await mockPanel(page);
  let resolvePreview = () => {};
  const pending = new Promise<void>((resolve) => {
    resolvePreview = resolve;
  });
  let previews = 0;
  await page.route("**/api/admin/transfer/preview", async (route) => {
    previews++;
    await pending;
    await route.fulfill({ json: { rows: [], fingerprint: "preview" } });
  });
  await page.getByRole("link", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  const zone = page.getByRole("button", { name: "Выбрать файл: Файл импорта HY2-P", exact: true });
  const file = { name: "hy2-p.json", type: "application/json", text: '{"format":"hy2-p/1"}' };
  await dropFiles(zone, [file, file]);
  await expect(page.locator(".notifications").getByRole("alert")).toContainText("Выберите один файл");
  expect(previews).toBe(0);
  await page.getByRole("button", { name: "Закрыть уведомление", exact: true }).click();
  await dropFiles(zone, [file]);
  await expect(zone).toBeDisabled();
  await dropFiles(zone, [file]);
  expect(previews).toBe(1);
  resolvePreview();
  await expect(zone).toBeEnabled();
  await expect(zone).not.toHaveClass(/file-dropzone-active/);
  expect(await zone.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.locator("#panel-transfer").screenshot({ path: info.outputPath("import-upload.png") });
});
