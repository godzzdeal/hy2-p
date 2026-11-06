import { test, expect } from "@playwright/test";
import { PNG } from "pngjs";
import ZXing from "@zxing/library";
import { mockPanel } from "../../fixtures";
const { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, QRCodeReader } = ZXing;
function decodeQr(png: Buffer): string {
  const image = PNG.sync.read(png);
  const luminance = new Uint8ClampedArray(image.width * image.height);
  for (let index = 0; index < luminance.length; index++) {
    const offset = index * 4;
    luminance[index] = (image.data[offset] + 2 * image.data[offset + 1] + image.data[offset + 2]) / 4;
  }
  return new QRCodeReader()
    .decode(
      new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(luminance, image.width, image.height))),
    )
    .getText();
}
test("styled QR codes decode to the exact URI and subscription", async ({ page }, info) => {
  await mockPanel(page);
  const links = {
    uri:
      "hysteria2://" +
      "p".repeat(48) +
      "@vpn.example.com:8443/?sni=vpn.example.com&obfs=salamander&obfs-password=" +
      "o".repeat(48) +
      "#" +
      encodeURIComponent("🇩🇪 🚀 Player"),
    subscription: "https://panel.example.com/sub/example-token-for-tests",
  };
  await page.route("http://panel.test/api/users/test-user/links", (route) => route.fulfill({ json: links }));
  await page.getByRole("button", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Добавить пользователя", exact: true }).click();
  await page.getByLabel("Имя", { exact: true }).fill("Player");
  await page.getByRole("button", { name: "Сохранить пользователя", exact: true }).click();
  await page.getByRole("button", { name: "Подключение Player", exact: true }).click();
  const frame = page.locator(".connection-qr");
  await expect(frame.getByRole("img", { name: "QR-код подключения", exact: true })).toBeVisible();
  expect(decodeQr(await frame.screenshot())).toBe(links.uri);
  await page.getByRole("button", { name: "Подписка", exact: true }).click();
  expect(decodeQr(await frame.screenshot({ path: info.outputPath("styled-qr.png") }))).toBe(
    links.subscription,
  );
});
