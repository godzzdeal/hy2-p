import { Caption } from "@/components/elements/Caption";
import { Notice } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button/Button";
import { PortRow } from "@/components/admin/firewall/ports/PortRow";
import { PortHelp } from "@/components/admin/firewall/ports/PortHelp";
import { QueryState } from "@/components/ui/loading";
import { useRecommendedPorts } from "@/hooks/admin/firewall/use-recommended-ports";
import { useTranslation } from "react-i18next";
import { groupRecommendedPorts } from "@/services/admin/firewall/recommendations";
export function PortGuide() {
  const { t } = useTranslation();
  const query = useRecommendedPorts();
  const ports = groupRecommendedPorts(query.data?.ports ?? []);
  return (
    <section className="firewall-guide mb-4 pb-4 border-b border-line" aria-label={t("Какие порты открыть")}>
      <h3>{t("Какие порты открыть")}</h3>
      {!!query.data?.warnings?.length && (
        <Notice variant="warning">
          {t("Не удалось прочитать настройки экземпляров:")} {query.data.warnings.join(", ")}
        </Notice>
      )}
      <Caption>{t("Порты панели и экземпляров. Доступность из интернета не проверена.")}</Caption>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.error && (
        <Button variant="secondary" onClick={() => void query.refetch()}>
          {t("Повторить")}
        </Button>
      )}
      <ul className="firewall-ports list-none p-0 m-0 grid gap-2">
        {ports.map((port) => (
          <PortRow key={`${port.port}/${port.protocol}`} port={port} />
        ))}
      </ul>
      <PortHelp />
    </section>
  );
}
