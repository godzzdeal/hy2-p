import { ArrowUpRight } from "@/components/elements/icons";
import { AccountRecovery } from "@/components/admin/account/AccountRecovery";
import { LanguageSelect } from "@/components/elements/LanguageSelect";
import { type ILoginCredentials } from "@/services/session/session-api";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

interface IPasswordLogin {
  isPending: boolean;
  onSubmit: (value: ILoginCredentials) => void;
}
export function PasswordLogin({ isPending, onSubmit }: IPasswordLogin) {
  const { t } = useTranslation();
  const [username, setUsername] = useState(localStorage.getItem("hy2.login") ?? "admin");
  const [password, setPassword] = useState("");
  function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ username, password });
  }
  return (
    <form onSubmit={onLogin}>
      <LanguageSelect />
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
      <button className="primary" disabled={isPending}>
        {t(isPending ? "Входим…" : "Войти в панель")}
        <ArrowUpRight width={24} height={24} aria-hidden />
      </button>
      <AccountRecovery />
    </form>
  );
}
