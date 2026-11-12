import { Caption } from "@/components/elements/Caption";
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
        <Caption>
          {t(
            "Откройте TCP-порт панели и UDP-порты экземпляров. Для HTTP-проверки ACME нужен TCP 80, для TLS-проверки TCP 443. DNS-проверке входящий порт не нужен.",
          )}
        </Caption>
        <Caption>
          {t(
            "Откройте нужные публичные порты и в firewall хостинга. SSH-порт оставьте открытым. Traffic Stats и внутренние порты панели не открывайте в интернет.",
          )}
        </Caption>
        <Caption>
          {t(
            "Закрыли нужный порт? Откройте его в панели или выполните команду выше через SSH. Для отмены правила найдите его номер и удалите эту строку:",
          )}
        </Caption>
        <CommandBlock command="sudo ufw status numbered" />
        <CommandBlock command={`sudo ufw delete ${t("НОМЕР_ПРАВИЛА")}`} />
        <Caption>
          {t(
            "Удаление правила не возвращает прежние правила. Не используйте ufw reset: он удалит их все. Публикация Docker и firewall хостинга настраиваются отдельно.",
          )}
        </Caption>
      </div>
    </details>
  );
}
