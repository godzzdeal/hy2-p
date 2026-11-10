import tailwind from "@tailwindcss/postcss";
import path from "node:path";
import { createRequire } from "node:module";
import { rspack, type Configuration } from "@rspack/core";
import { WEB_ROOT } from "../paths.ts";
import { styleModules } from "./postcss.ts";
import { writeClassMapping } from "./mapping.ts";
const require = createRequire(import.meta.url);
export function styleModule(isProduction: boolean): Configuration["module"] {
  return {
    rules: [
      {
        test: /\.(sass|scss)$/,
        type: "javascript/auto",
        use: [
          rspack.CssExtractRspackPlugin.loader,
          {
            loader: "css-loader",
            options: {
              importLoaders: 2,
              modules: {
                auto: true,
                namedExport: false,
                exportLocalsConvention: "as-is",
                localIdentName: isProduction ? "h_[hash:base64:8]" : "[local]",
                getJSON: writeClassMapping,
              },
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  tailwind({ base: path.resolve(WEB_ROOT, "src"), transformAssetUrls: false }),
                  styleModules(),
                ],
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
            transform: { react: { runtime: "automatic", importSource: "@/styles/runtime" } },
          },
        },
      },
      {
        test: /\.css$/,
        type: "javascript/auto",
        use: [
          rspack.CssExtractRspackPlugin.loader,
          "css-loader",
          { loader: "postcss-loader", options: { postcssOptions: { plugins: [tailwind()] } } },
        ],
      },
    ],
  };
}
