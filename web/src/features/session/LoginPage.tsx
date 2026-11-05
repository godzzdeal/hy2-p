import { useTranslation } from "react-i18next";
import { useState } from "react";
import { type FormEvent } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { LanguageSelect } from "@/shared/i18n";
import { useSession } from "./use-session";
export function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState(localStorage.getItem("hy2.login") ?? "admin");
  const [password, setPassword] = useState("");
  const { login } = useSession();
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate({ username, password });
  }
  return (
    <div className="login">
      <div className="login-brand">
        <ShieldCheck size={32} aria-hidden />
        <span>
          HY2 <span className="muted">/ CONTROL</span>
        </span>
      </div>
      <form onSubmit={onSubmit}>
        <LanguageSelect />
        <span className="eyebrow">{t("ПАНЕЛЬ УПРАВЛЕНИЯ")}</span>
        <h1>
          {t("Ваш сервер.")}
          <br />
          {t("Ваши правила.")}
        </h1>
        <p className="muted">{t("Войдите, чтобы управлять Hysteria2.")}</p>
        <label>
          {t("Логин")}
          <input
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          {t("Пароль")}
          <input
            autoFocus
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="primary" disabled={login.isPending}>
          {login.isPending ? t("Входим\u2026") : t("Войти в панель")}
          <ArrowUpRight size={20} aria-hidden />
        </button>
      </form>
      <small>Hysteria 2</small>
    </div>
  );
}
