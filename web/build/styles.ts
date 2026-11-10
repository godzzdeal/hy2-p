import tailwind from "@tailwindcss/postcss";
import path from "node:path";
import { createRequire } from "node:module";
import { type Configuration } from "@rspack/core";
import { WEB_ROOT } from "./paths.ts";
const require = createRequire(import.meta.url);
export const STYLE_MODULE: Configuration["module"] = {
  rules: [
    {
      test: /\.(sass|scss)$/,
      type: "css",
      use: [
        {
          loader: "postcss-loader",
          options: {
            postcssOptions: {
              plugins: [tailwind({ base: path.resolve(WEB_ROOT, "src"), transformAssetUrls: false })],
            },
          },
        },
        {
          loader: "sass-loader",
          options: {
            api: "modern-compiler",
            implementation: require.resolve("sass-embedded"),
            sassOptions: { style: "expanded" },
          },
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
          target: "es2022",
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
};
