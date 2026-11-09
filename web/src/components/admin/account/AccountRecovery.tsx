import { CommandBlock } from "@/components/elements/CommandBlock";
import { useTranslation } from "react-i18next";
export function AccountRecovery() {
  const { t } = useTranslation();
  return (
    <details className="mt-4">
      <summary>{t("Забыли пароль?")}</summary>
      <div className="grid gap-3 mt-3">
        <p className="caption">
          {t(
            "Выполните команду на сервере через SSH. Она создаст новый пароль и завершит сеансы панели. Подключения VPN кратковременно прервутся.",
          )}
        </p>
        <CommandBlock command="sudo hy2-panel password-reset" />
        <p className="caption">
          {t("Логин и облачный пароль сохранятся. Новый пароль будет показан в терминале.")}
        </p>
      </div>
    </details>
  );
}
