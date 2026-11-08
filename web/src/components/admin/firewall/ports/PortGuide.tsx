import { PortRow } from "@/components/admin/firewall/ports/PortRow";
import { QueryState } from "@/components/ui/QueryState";
import { useRecommendedPorts } from "@/hooks/admin/firewall/use-recommended-ports";
import { useTranslation } from "react-i18next";
export function PortGuide() {
  const { t } = useTranslation();
  const query = useRecommendedPorts();
  return (
    <section className="firewall-guide" aria-label={t("Какие порты открыть")}>
      <h3>{t("Какие порты открыть")}</h3>
      <p className="caption">
        {t(
          "Обычно нужны TCP-порт панели, UDP-порты ядер и TCP 80 для HTTP ACME или 443 для TLS ACME. DNS ACME не требует входящего порта.",
        )}
      </p>
      <p className="caption">
        {t(
          "Ниже порты из сохранённых настроек и текущей публикации Docker. Это рекомендации, доступность извне не проверялась.",
        )}
      </p>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.error && (
        <button className="secondary" onClick={() => void query.refetch()}>
          {t("Повторить")}
        </button>
      )}
      <ul className="firewall-ports">
        {query.data?.ports?.map((port, index) => (
          <PortRow key={`${port.source}-${port.purpose}-${port.port}-${index}`} port={port} />
        ))}
      </ul>
      {!!query.data?.warnings?.length && (
        <p className="inline-error">
          {t("Не удалось прочитать настройки ядер:")} {query.data.warnings.join(", ")}
        </p>
      )}
      <p className="caption">
        {t(
          "Не открывайте Traffic Stats и внутренние порты панели в интернет. SSH-порт оставьте разрешённым. Те же публичные порты разрешите в firewall хостинга.",
        )}
      </p>
      <h3>{t("Как вернуть доступ или отменить правило")}</h3>
      <p className="caption">
        {t(
          "Если закрыли нужный порт, выберите «Открыть порт» или выполните его команду выше через SSH. Для удаления добавленного правила посмотрите его номер и удалите только эту строку:",
        )}
      </p>
      <pre className="firewall-example">
        sudo ufw status numbered{"\n"}sudo ufw delete {t("НОМЕР_ПРАВИЛА")}
      </pre>
      <p className="caption">
        {t(
          "Удаление правила не восстанавливает прежние правила. Не используйте ufw reset для отката. UFW не заменяет публикацию Docker и firewall хостинга.",
        )}
      </p>
    </section>
  );
}
