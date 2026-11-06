import tailwind from "@tailwindcss/postcss";
import path from "node:path";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
export default defineConfig({
  entry: "./src/main.tsx",
  output: { clean: true, publicPath: "/" },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@config-schema": path.resolve(import.meta.dirname, "../internal/configuration/ordering/order.json"),
    },
  },
  module: {
    rules: [
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
    new rspack.CopyRspackPlugin({
      patterns: [
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
      title: "HY2 / Control",
      meta: { viewport: "width=device-width, initial-scale=1" },
    }),
  ],
  optimization: { splitChunks: { chunks: "all" } },
  devServer: {
    host: "127.0.0.1",
    port: 3000,
    historyApiFallback: true,
    proxy: [{ context: ["/api", "/sub"], target: "http://127.0.0.1:8080" }],
  },
});
