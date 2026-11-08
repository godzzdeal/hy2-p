import { Dashboard } from "@/components/layout/Dashboard";
import { Feedback } from "@/components/ui/Feedback";
import { QueryState } from "@/components/ui/QueryState";
import { useInstall } from "@/hooks/install/use-install";
import { useSession } from "@/hooks/session/use-session";
import { useTheme } from "@/hooks/use-theme";
import { LoginPage } from "@/pages/panel/LoginPage";
export function App() {
  useTheme();
  useInstall();
  const session = useSession();
  if (session.isLoading) return <QueryState isLoading />;
  if (session.error) return <QueryState isLoading={false} error={session.error} />;
  return (
    <>
      {session.isAuthorized ? <Dashboard /> : <LoginPage />}
      <Feedback />
    </>
  );
}
