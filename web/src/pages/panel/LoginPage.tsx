import { ShieldCheck } from "@/components/elements/icons";
import { SpaceScene } from "@/components/layout/SpaceScene";
import { CloudLogin, PasswordLogin } from "@/components/session";
import { useSession } from "@/hooks/session/use-session";

export function LoginPage() {
  const { login } = useSession();
  const challenge = login.data && "cloudPasswordRequired" in login.data ? login.data.challenge : "";
  return (
    <div className="login">
      <SpaceScene />
      <h1 className="login-brand">
        <ShieldCheck width={24} height={24} aria-hidden />
        <span>HY2-P</span>
      </h1>
      {challenge ? (
        <CloudLogin challenge={challenge} onBack={() => login.reset()} />
      ) : (
        <PasswordLogin isPending={login.isPending} onSubmit={(value) => login.mutate(value)} />
      )}
      <small>Hysteria 2</small>
    </div>
  );
}
