import { lazy, Suspense } from "react";
import { QueryState } from "@/components/ui/loading";
import { useInstall } from "@/hooks/install/use-install";
import { useSession } from "@/hooks/session/use-session";
import { useTheme } from "@/hooks/use-theme";
import { LoginPage } from "@/pages/panel/LoginPage";
const Dashboard = lazy(() =>
  import("@/components/layout/Dashboard").then((module) => ({ default: module.Dashboard })),
);
export function App() {
  useTheme();
  useInstall();
  const session = useSession();
  if (session.isLoading) return <QueryState isLoading className="startup-loader min-h-dvh" />;
  if (session.error) return <QueryState isLoading={false} error={session.error} />;
  return (
    <Suspense fallback={<QueryState isLoading className="startup-loader" />}>
      {session.isAuthorized ? <Dashboard /> : <LoginPage />}
    </Suspense>
  );
}
