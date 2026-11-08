import { App } from "@/app/App";
import { ApplyPortProgress } from "@/components/configuration/ports/ApplyPortProgress";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import "@/config/i18n/setup";
import { QueryProvider } from "@/providers/QueryProvider";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./styles/features/demo.scss";
import "./styles/features/admin/firewall.scss";
import "./styles/features/admin/account/cloud.scss";
import "./styles/features/groups/hierarchy.scss";
import "./styles/features/groups/forms.scss";
import "./styles/features/groups/identity.scss";
const root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <App />
        <ApplyPortProgress />
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>,
);
