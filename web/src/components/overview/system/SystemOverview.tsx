import { QueryState } from "@/components/ui/loading";
import { SystemContent } from "@/components/overview/system/SystemContent";
import { useSystemMetrics } from "@/hooks/admin/maintenance";
import { useTranslation } from "react-i18next";

export function SystemOverview() {
  const { t } = useTranslation();
  const { read, traffic } = useSystemMetrics();
  const data = read.data;
  return (
    <section id="overview-system" data-scroll-section data-scroll-label={t("Состояние сервера")}>
      <div className="system-heading">
        <h2>{t("Состояние сервера")}</h2>
        <small>{t("Обновление каждые 5 секунд")}</small>
      </div>
      <QueryState isLoading={read.isPending} error={read.error} />
      {data && <SystemContent data={data} traffic={traffic} />}
    </section>
  );
}
