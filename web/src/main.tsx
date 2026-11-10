import { App } from "@/app/App";
import { PanelProgress } from "@/components/panel/maintenance/progress/PanelProgress";
import { CoreProgress } from "@/components/core/progress";
import { ApplyPortProgress } from "@/components/configuration/ports/ApplyPortProgress";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Feedback } from "@/components/ui/feedback/Feedback";
import "@/config/i18n/setup";
import { QueryProvider } from "@/providers/QueryProvider";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/layers.scss";
import "./styles/index.scss";
const root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <App />
        <ApplyPortProgress />
        <PanelProgress />
        <Feedback>
          <CoreProgress />
        </Feedback>
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>,
);
