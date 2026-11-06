import { useTranslation } from "react-i18next";
import { PasswordField } from "@/shared/security";
import { useState } from "react";
import { type FormEvent } from "react";
import { type IUser } from "@/features/users/model";
import { useUserCommands } from "@/features/users/model";
import { UserNameField } from "./UserNameField";
import { Modal } from "@/shared/ui";
interface IUserEditor {
  user?: IUser;
  onClose: () => void;
}
export function UserEditor({ user, onClose }: IUserEditor) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [expires, setExpires] = useState(user?.expires.slice(0, 10) ?? "");
  const [isEnabled, setEnabled] = useState(user?.enabled ?? true);
  const { create, update } = useUserCommands();
  const isPending = create.isPending || update.isPending;
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = {
      name,
      password,
      expires: expires ? new Date(expires + "T23:59:59").toISOString() : "",
    };
    if (user) update.mutate({ id: user.id, body: { ...body, enabled: isEnabled } }, { onSuccess: onClose });
    else create.mutate(body, { onSuccess: onClose });
  }
  return (
    <Modal title={user ? t("Редактировать пользователя") : t("Новый пользователь")} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <UserNameField value={name} onChange={setName} />
        <label>
          {t("Доступ до")}
          <input type="date" value={expires} onChange={(event) => setExpires(event.target.value)} />
          <small>{t("Оставьте пустым для бессрочного доступа.")}</small>
        </label>
        {user && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            {t("Доступ включён")}
          </label>
        )}
        <PasswordField
          value={password}
          onChange={setPassword}
          label={user ? t("Новый пароль подключения") : t("Пароль подключения (или автоматический)")}
        />
        <button disabled={isPending} className="primary full">
          {isPending ? t("Сохраняем\u2026") : t("Сохранить пользователя")}
        </button>
      </form>
    </Modal>
  );
}
