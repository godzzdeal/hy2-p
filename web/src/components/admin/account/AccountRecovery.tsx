import { Caption } from "@/components/elements/Caption";
import { CommandBlock } from "@/components/elements/copy";
import { ChevronRight } from "pixelarticons/react/ChevronRight.js";
import { useTranslation } from "react-i18next";
export function AccountRecovery() {
  const { t } = useTranslation();
  return (
    <details className="mt-4">
      <summary>
        <ChevronRight width={24} height={24} aria-hidden />
        {t("Забыли пароль?")}
      </summary>
      <div className="grid gap-3 mt-3">
        <Caption>
          {t(
            "Выполните команду на сервере через SSH. Она создаст новый пароль и завершит сеансы панели. Подключения VPN кратковременно прервутся.",
          )}
        </Caption>
        <CommandBlock command="sudo hy2-panel password-reset" />
        <Caption>{t("Новый пароль будет показан в терминале.")}</Caption>
      </div>
    </details>
  );
}
