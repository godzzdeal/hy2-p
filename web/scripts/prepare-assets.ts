import { cpSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public");
cpSync(
  path.resolve(root, "../internal/configuration/ordering/order.json"),
  path.join(root, "src/config/hysteria/order.generated.json"),
);
mkdirSync(output, { recursive: true });
for (const [source, destination] of [
  ["node_modules/@twemoji/svg", "emoji"],
  ["node_modules/flag-icons/flags/4x3", "flags"],
]) {
  cpSync(path.join(root, source), path.join(output, destination), {
    recursive: true,
    filter: (file) => statSync(file).isDirectory() || file.endsWith(".svg"),
  });
}
for (const [source, destination] of [
  ["assets/pwa/icons", "app-icons"],
  ["assets/pwa/manifest.webmanifest", "manifest.webmanifest"],
  ["assets/epilepsy-sans/FreeLicense.txt", "licenses/epilepsy-sans.txt"],
  ["assets/starfield.svg", "starfield.svg"],
  ["node_modules/pixelarticons/svg/check.svg", "check.svg"],
  ["node_modules/flag-icons/LICENSE", "licenses/flag-icons.txt"],
  ["node_modules/pixelarticons/LICENSE", "licenses/pixelarticons.txt"],
  ["node_modules/@twemoji/svg/license", "licenses/twemoji-package.txt"],
  ["assets/twemoji-license.txt", "licenses/twemoji-graphics.txt"],
]) {
  const target = path.join(output, destination);
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(path.join(root, source), target, { recursive: true });
}
