import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import localFont from "next/font/local";
import { Providers } from "@/providers/Providers";
import "@/styles/tailwind.css";
import "@/styles/globals.scss";

const pixel = localFont({
  src: [
    {
      path: "../../assets/epilepsy-sans/EpilepsySans.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/epilepsy-sans/EpilepsySansBold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HY2-P",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/app-icons/icon.svg",
    apple: "/app-icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "HY2-P", statusBarStyle: "default" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#081320",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await connection();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="ru" className={pixel.variable} suppressHydrationWarning>
      <body>
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
