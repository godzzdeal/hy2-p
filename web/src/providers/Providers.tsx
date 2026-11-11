"use client";
import { ThemeProvider } from "next-themes";
import { App } from "@/app/App";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { QueryProvider } from "@/providers/QueryProvider";
import { Loader } from "@/components/ui/loading";
import { Suspense, type ReactNode } from "react";

export function Providers({ children, nonce }: { children: ReactNode; nonce?: string }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      storageKey="hy2.theme"
      nonce={nonce}
    >
      <ErrorBoundary>
        <QueryProvider>
          <Suspense fallback={<Loader className="min-h-dvh" />}>
            <App>{children}</App>
          </Suspense>
        </QueryProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
