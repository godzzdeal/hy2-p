import { Actions } from "@/components/ui/Actions";
import { QueryState } from "@/components/ui/loading";
import { SystemContent } from "@/components/overview/system/SystemContent";
import { ChartPreferences } from "@/components/overview/system/preferences";
import { useSystemMetrics } from "@/hooks/admin/maintenance";
import { useTranslation } from "react-i18next";

export function SystemOverview() {
  const { t } = useTranslation();
  const { read, traffic, hasVisibleCharts } = useSystemMetrics();
  const data = read.data;
  return (
    <section id="overview-system" data-scroll-section data-scroll-label={t("Состояние сервера")}>
      <div className="system-heading flex items-center justify-between gap-4 mb-4 flex-wrap">
        <h2>{t("Состояние сервера")}</h2>
        <Actions>
          <small>{t(hasVisibleCharts ? "Обновление каждые 5 секунд" : "Графики скрыты")}</small>
          <ChartPreferences />
        </Actions>
      </div>
      <QueryState isLoading={read.isPending} error={read.error} />
      {data && <SystemContent data={data} traffic={traffic} />}
    </section>
  );
}
