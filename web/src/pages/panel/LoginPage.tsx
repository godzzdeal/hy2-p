import { ShieldCheck } from "@/components/elements/icons";
import { SpaceScene } from "@/components/layout/SpaceScene";
import { CloudLogin, PasswordLogin } from "@/components/session";
import { useSession } from "@/hooks/session/use-session";

export function LoginPage() {
  const { login } = useSession();
  const challenge = login.data && "cloudPasswordRequired" in login.data ? login.data.challenge : "";
  return (
    <div className="login min-h-dvh py-10 px-6 flex flex-col items-center justify-center">
      {IS_DEMO && <DemoNotice />}
      <SpaceScene />
      <h1 className="login-brand flex items-center gap-3 text-accent text-2xl mb-5">
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
import { DemoNotice } from "@/components/demo/DemoNotice";
import { IS_DEMO } from "@/config/build";
