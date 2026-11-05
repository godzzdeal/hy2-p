import "@/shared/i18n/setup";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "@/app";
import { ErrorBoundary } from "@/shared/ui";
import { NETWORK } from "@/shared/http";
import "./styles/index.css";
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: NETWORK.staleMs, retry: 1 } },
});
const root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
