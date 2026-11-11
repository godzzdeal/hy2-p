"use client";
import type { ReactNode } from "react";
import { QueryState } from "@/components/ui/loading";
import { useInstall } from "@/hooks/install/use-install";
import { useSession } from "@/hooks/session/use-session";
import { useTheme } from "@/hooks/use-theme";
import { LoginPage } from "@/views/panel/LoginPage";
import { Dashboard } from "@/components/layout/Dashboard";
import { PanelProgress } from "@/components/panel/maintenance/progress/PanelProgress";
import { ApplyPortProgress } from "@/components/configuration/ports/ApplyPortProgress";
import { CoreProgress } from "@/components/core/progress";
import { Feedback } from "@/components/ui/feedback/Feedback";
import { useLanguage } from "@/hooks/use-language";

export function App({ children }: { children: ReactNode }) {
  useTheme();
  useInstall();
  useLanguage();
  const session = useSession();
  return (
    <>
      {session.isLoading ? (
        <QueryState isLoading className="startup-loader min-h-dvh" />
      ) : session.error ? (
        <QueryState isLoading={false} error={session.error} />
      ) : session.isAuthorized ? (
        <Dashboard>{children}</Dashboard>
      ) : (
        <LoginPage />
      )}
      <ApplyPortProgress />
      <PanelProgress />
      <Feedback>
        <CoreProgress />
      </Feedback>
    </>
  );
}
