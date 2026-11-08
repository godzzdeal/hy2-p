import { PortRow } from "@/components/admin/firewall/ports/PortRow";
import { PortHelp } from "@/components/admin/firewall/ports/PortHelp";
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
      <PortHelp />
    </section>
  );
}
