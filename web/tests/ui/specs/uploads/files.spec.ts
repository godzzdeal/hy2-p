import { expect, test } from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";
import { dropFiles } from "./drop";

const YAML = "listen: :62000\ntls:\n  cert: /certs/server.crt\n  key: /certs/server.key\n";

test("YAML supports drag feedback, keyboard selection and invalid-file notifications", async ({
  page,
}, info) => {
  await mockPanel(page);
  await page.getByRole("button", { name: "Конфигурация", exact: true }).click();
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
  await expect(page.getByRole("alert")).toContainText("Неподдерживаемый формат файла");
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
  await page.route("http://panel.test/api/admin/transfer/preview", async (route) => {
    previews++;
    await pending;
    await route.fulfill({ json: { rows: [], fingerprint: "preview" } });
  });
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expandSettings(page);
  const zone = page.getByRole("button", { name: "Выбрать файл: Файл импорта HY2-P", exact: true });
  const file = { name: "hy2-p.json", type: "application/json", text: '{"format":"hy2-p/1"}' };
  await dropFiles(zone, [file, file]);
  await expect(page.getByRole("alert")).toContainText("Выберите один файл");
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
