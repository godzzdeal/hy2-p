import { useCloudLogin } from "@/hooks/session/use-cloud-login";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

export function CloudLogin({ challenge, onBack }: { challenge: string; onBack: () => void }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const login = useCloudLogin();
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate({ challenge, password });
  }
  return (
    <form className="cloud-login" onSubmit={onSubmit}>
      <h2>{t("Облачный пароль")}</h2>
      <p className="caption">{t("Введите дополнительный пароль, чтобы завершить вход.")}</p>
      <label>
        {t("Облачный пароль")}
        <input
          autoFocus
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button className="primary" disabled={login.isPending}>
        {t(login.isPending ? "Проверяем…" : "Подтвердить")}
      </button>
      <button type="button" className="secondary full" disabled={login.isPending} onClick={onBack}>
        {t("Вернуться к входу")}
      </button>
      <p className="caption">{t("Забыли пароль? Сброс доступен владельцу сервера через SSH.")}</p>
    </form>
  );
}
