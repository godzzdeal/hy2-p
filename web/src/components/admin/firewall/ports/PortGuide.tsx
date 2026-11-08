import { PortRow } from "@/components/admin/firewall/ports/PortRow";
import { PortHelp } from "@/components/admin/firewall/ports/PortHelp";
import { QueryState } from "@/components/ui/QueryState";
import { useRecommendedPorts } from "@/hooks/admin/firewall/use-recommended-ports";
import { useTranslation } from "react-i18next";
import { groupRecommendedPorts } from "@/services/admin/firewall/recommendations";
export function PortGuide() {
  const { t } = useTranslation();
  const query = useRecommendedPorts();
  const ports = groupRecommendedPorts(query.data?.ports ?? []);
  return (
    <section className="firewall-guide" aria-label={t("Какие порты открыть")}>
      <h3>{t("Какие порты открыть")}</h3>
      <p className="caption">{t("Порты из настроек панели и ядер. Доступность извне не проверена.")}</p>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.error && (
        <button className="secondary" onClick={() => void query.refetch()}>
          {t("Повторить")}
        </button>
      )}
      <ul className="firewall-ports">
        {ports.map((port) => (
          <PortRow key={`${port.port}/${port.protocol}`} port={port} />
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
