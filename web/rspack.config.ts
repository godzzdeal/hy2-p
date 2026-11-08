import tailwind from "@tailwindcss/postcss";
import path from "node:path";
import { createRequire } from "node:module";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
const require = createRequire(import.meta.url);
export default defineConfig((env: { demo?: boolean }) => ({
  entry: "./src/main.tsx",
  output: {
    clean: true,
    publicPath: "/",
    path: path.resolve(import.meta.dirname, env.demo ? "dist-demo" : "dist"),
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@panel-api": path.resolve(
        import.meta.dirname,
        env.demo ? "src/services/demo/request.ts" : "src/services/http/remote.ts",
      ),
      "@": path.resolve(import.meta.dirname, "src"),
      "@config-schema": path.resolve(import.meta.dirname, "../internal/configuration/ordering/order.json"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        type: "css",
        use: [
          {
            loader: "sass-loader",
            options: { api: "modern-compiler", implementation: require.resolve("sass-embedded") },
          },
        ],
      },
      {
        test: /\.svg$/,
        type: "asset/resource",
        generator: { filename: "icons/[name].[contenthash][ext]" },
      },
      {
        test: /\.(woff2?|ttf)$/,
        type: "asset/resource",
        generator: { filename: "fonts/[name].[contenthash][ext]" },
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: { syntax: "typescript", tsx: true },
            transform: { react: { runtime: "automatic" } },
          },
        },
      },
      {
        test: /\.css$/,
        type: "css",
        use: [{ loader: "postcss-loader", options: { postcssOptions: { plugins: [tailwind()] } } }],
      },
    ],
  },
  experiments: { css: true },
  plugins: [
    new rspack.DefinePlugin({ __HY2_DEMO__: JSON.stringify(env.demo === true) }),
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: path.resolve(import.meta.dirname, "assets/pwa/manifest.webmanifest"),
          to: "manifest.webmanifest",
        },
        { from: path.resolve(import.meta.dirname, "assets/pwa/icons"), to: "app-icons" },
        {
          from: path.resolve(import.meta.dirname, "assets/epilepsy-sans/FreeLicense.txt"),
          to: "licenses/epilepsy-sans.txt",
        },
        {
          from: path.resolve(import.meta.dirname, "node_modules/pixelarticons/LICENSE"),
          to: "licenses/pixelarticons.txt",
        },
        {
          from: path.resolve(import.meta.dirname, "node_modules/@twemoji/svg/*.svg"),
          to: "emoji/[name][ext]",
        },
        {
          from: path.resolve(import.meta.dirname, "node_modules/@twemoji/svg/license"),
          to: "licenses/twemoji-package.txt",
        },
        {
          from: path.resolve(import.meta.dirname, "assets/twemoji-license.txt"),
          to: "licenses/twemoji-graphics.txt",
        },
        { from: path.resolve(import.meta.dirname, "node_modules/flag-icons/flags/4x3"), to: "flags" },
        {
          from: path.resolve(import.meta.dirname, "node_modules/flag-icons/LICENSE"),
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
      favicon: path.resolve(import.meta.dirname, "assets/pwa/icons/icon.svg"),
    }),
  ],
  optimization: { splitChunks: { chunks: "all" } },
  devServer: {
    host: "127.0.0.1",
    port: 3000,
    historyApiFallback: true,
    proxy: [{ context: ["/api", "/sub"], target: "http://127.0.0.1:8080" }],
  },
}));
