import { rspack } from "@rspack/core";
import path from "node:path";
import { WEB_ROOT } from "./paths.ts";
export const ASSET_PLUGINS = [
  new rspack.CopyRspackPlugin({
    patterns: [
      {
        from: path.resolve(WEB_ROOT, "assets/pwa/manifest.webmanifest"),
        to: "manifest.webmanifest",
      },
      { from: path.resolve(WEB_ROOT, "assets/pwa/icons"), to: "app-icons" },
      {
        from: path.resolve(WEB_ROOT, "assets/epilepsy-sans/FreeLicense.txt"),
        to: "licenses/epilepsy-sans.txt",
      },
      {
        from: path.resolve(WEB_ROOT, "node_modules/pixelarticons/LICENSE"),
        to: "licenses/pixelarticons.txt",
      },
      {
        from: path.resolve(WEB_ROOT, "node_modules/@twemoji/svg/*.svg"),
        to: "emoji/[name][ext]",
      },
      {
        from: path.resolve(WEB_ROOT, "node_modules/@twemoji/svg/license"),
        to: "licenses/twemoji-package.txt",
      },
      {
        from: path.resolve(WEB_ROOT, "assets/twemoji-license.txt"),
        to: "licenses/twemoji-graphics.txt",
      },
      { from: path.resolve(WEB_ROOT, "node_modules/flag-icons/flags/4x3/*.svg"), to: "flags/[name][ext]" },
      {
        from: path.resolve(WEB_ROOT, "node_modules/flag-icons/LICENSE"),
        to: "licenses/flag-icons.txt",
      },
    ],
  }),
  new rspack.HtmlRspackPlugin({
    title: "HY2-P",
    meta: {
      viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
      "theme-color": "#081320",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-title": "HY2-P",
      "apple-mobile-web-app-status-bar-style": "default",
    },
    templateContent:
      '<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>HY2-P</title><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/app-icons/apple-touch-icon.png"></head><body></body></html>',
    favicon: path.resolve(WEB_ROOT, "assets/pwa/icons/icon.svg"),
  }),
];
