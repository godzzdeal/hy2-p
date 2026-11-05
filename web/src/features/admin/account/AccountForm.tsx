import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { FormEvent } from "react";
import { useAccountChange } from "@/features/admin/model";
import { PasswordField } from "@/shared/security";
export function AccountForm({ username }: { username: string }) {
  const { t } = useTranslation();
  const [name, setName] = useState(username);
  const [currentPassword, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useAccountChange();
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ username: name, currentPassword, password });
  }
  return (
    <form
      className="card settings-form"
      onSubmit={onSubmit}
      id="panel-account"
      data-scroll-section
      data-scroll-label={t("Учётная запись администратора")}
    >
      <div className="card-header">
        <h2>{t("Учётная запись администратора")}</h2>
      </div>
      <div className="form-body">
        <label>
          {t("Логин")}
          <input
            required
            autoComplete="username"
            minLength={3}
            maxLength={64}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          {t("Текущий пароль")}
          <input
            required
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </label>
        <PasswordField
          label={t("Новый пароль (не менее 16 символов)")}
          value={password}
          onChange={setPassword}
        />
        <p className="caption">
          {t(
            "Оставьте новый пароль пустым, чтобы изменить только логин. После сохранения все сессии будут завершены.",
          )}
        </p>
        <button className="primary" disabled={mutation.isPending}>
          {t("Изменить данные входа")}
        </button>
      </div>
    </form>
  );
}
