import { ChevronRight } from "@/components/elements/icons";
import { CommandBlock } from "@/components/elements/copy";
import { useTranslation } from "react-i18next";

export function PortHelp() {
  const { t } = useTranslation();
  return (
    <details className="firewall-help">
      <summary>
        <ChevronRight width={24} height={24} aria-hidden />
        {t("Открытие портов и отмена правил")}
      </summary>
      <div>
        <p className="caption">
          {t(
            "Обычно нужны TCP-порт панели, UDP-порты экземпляров и TCP 80 для HTTP ACME или 443 для TLS ACME. DNS ACME не требует входящего порта.",
          )}
        </p>
        <p className="caption">
          {t(
            "Не открывайте Traffic Stats и внутренние порты панели в интернет. SSH-порт оставьте разрешённым. Те же публичные порты разрешите в firewall хостинга.",
          )}
        </p>
        <p className="caption">
          {t(
            "Если закрыли нужный порт, выберите «Открыть порт» или выполните его команду выше через SSH. Для удаления добавленного правила посмотрите его номер и удалите только эту строку:",
          )}
        </p>
        <CommandBlock command="sudo ufw status numbered" />
        <CommandBlock command={`sudo ufw delete ${t("НОМЕР_ПРАВИЛА")}`} />
        <p className="caption">
          {t(
            "Удаление правила не восстанавливает прежние правила. Не используйте ufw reset для отката. UFW не заменяет публикацию Docker и firewall хостинга.",
          )}
        </p>
      </div>
    </details>
  );
}
