import path from "node:path";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import { WEB_ROOT, PANEL_VERSION, STYLE_MODULE, ASSET_PLUGINS } from "./build/index.ts";
export default defineConfig((env: { demo?: boolean }) => ({
  entry: "./src/main.tsx",
  output: {
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].js",
    cssFilename: "[name].[contenthash:8].css",
    cssChunkFilename: "[name].[contenthash:8].css",
    clean: true,
    publicPath: "/",
    path: path.resolve(WEB_ROOT, env.demo ? "dist-demo" : "dist"),
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@assets": path.resolve(WEB_ROOT, "assets"),
      "@pixel-icons": path.resolve(WEB_ROOT, "node_modules/pixelarticons/svg"),
      "@panel-api": path.resolve(
        WEB_ROOT,
        env.demo ? "src/services/demo/request.ts" : "src/services/http/remote.ts",
      ),
      "@": path.resolve(WEB_ROOT, "src"),
      "@config-schema": path.resolve(WEB_ROOT, "../internal/configuration/ordering/order.json"),
    },
  },
  experiments: { css: true },
  optimization: { splitChunks: { chunks: "all" as const } },
  devServer: {
    host: "127.0.0.1",
    port: 3000,
    historyApiFallback: true,
    proxy: [{ context: ["/api", "/sub"], target: "http://127.0.0.1:8080" }],
  },
  module: STYLE_MODULE,
  plugins: [
    new rspack.DefinePlugin({
      __HY2_DEMO__: JSON.stringify(env.demo === true),
      __HY2_PANEL_VERSION__: JSON.stringify(PANEL_VERSION),
    }),
    ...ASSET_PLUGINS,
  ],
}));
