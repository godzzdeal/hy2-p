import { useSession, LoginPage } from "@/features/session";
import { Feedback, QueryState } from "@/shared/ui";
import { Dashboard } from "./layout";
import { useTheme } from "@/app/state";
export function App() {
  useTheme();
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
