import type { NextConfig } from "next";
import { version } from "./package.json";

const backend = process.env.HY2_API_URL ?? "http://127.0.0.1:18080";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  devIndicators: false,
  env: { NEXT_PUBLIC_HY2_PANEL_VERSION: version },
  distDir: process.env.NEXT_PUBLIC_HY2_DEMO === "true" ? ".next-demo" : ".next",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: backend + "/api/:path*" },
      { source: "/sub/:path*", destination: backend + "/sub/:path*" },
    ];
  },
  async redirects() {
    return [
      {
        source: "/install.sh",
        destination: "https://github.com/godzzdeal/hy2-p/releases/latest/download/install.sh",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      ...["/flags/:path*", "/emoji/:path*"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
