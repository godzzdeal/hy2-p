import path from "node:path";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
export default defineConfig({
  entry: "./src/main.tsx",
  output: { clean: true, publicPath: "/" },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: { "@": path.resolve(import.meta.dirname, "src") },
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
      { test: /\.css$/, type: "css" },
    ],
  },
  experiments: { css: true },
  plugins: [
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
