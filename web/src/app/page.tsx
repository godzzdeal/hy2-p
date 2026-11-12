"use client";
import { usePageNavigation } from "@/hooks/layout/use-page-navigation";
import { QuickStart } from "@/components/overview/start/QuickStart";
import { Metric } from "@/components/ui/status/Metric";
import { Button } from "@/components/ui/button/Button";
import { QueryState } from "@/components/ui/loading";
import { SystemOverview } from "@/components/overview/system";
import { useConfiguration } from "@/hooks/configuration/use-configuration";
import { useCore } from "@/hooks/core/use-core";
import { useUsers } from "@/hooks/users/user-queries";
import { isUserActive } from "@/services/users/user-types";
import { useTranslation } from "react-i18next";
export default function OverviewPage() {
  const { t } = useTranslation();
  const users = useUsers();
  const config = useConfiguration();
  const core = useCore();
  const { selectPage } = usePageNavigation();
  return (
    <>
      <div className="page-heading flex justify-between items-start gap-4 mb-5 max-tablet:flex-col max-tablet:items-start">
        <div>
          <h1>{t("Ваш сервер")}</h1>
        </div>
      </div>
      <QueryState
        isLoading={users.isPending || config.isPending || core.isPending}
        error={users.error || config.error || core.error}
      />
      <div
        className="metrics grid gap-3 mb-4"
        id="overview-status"
        data-scroll-section
        data-scroll-label={t("Состояние экземпляра")}
      >
        <Metric
          label={t("Состояние экземпляра")}
          value={core.data?.running ? t("Запущено") : t("Остановлено")}
        >
          {core.data?.available ? t("Hysteria2 установлен") : t("Установите HY2 в разделе «Управление HY2».")}
        </Metric>
        <Metric label={t("Пользователи")} value={users.data?.length ?? 0}>
          {users.data?.filter(isUserActive).length ?? 0} {t("с активным доступом")}
        </Metric>
        <Metric label={t("Адрес подключения")} value={config.data?.host || t("Не настроен")}>
          UDP / {config.data?.port || "8443"}
        </Metric>
      </div>
      <SystemOverview />
      <div
        className="overview-grid grid grid-cols-2 gap-4 max-tablet:grid-cols-1 max-tablet:gap-0"
        id="overview-start"
        data-scroll-section
        data-scroll-label={t("Быстрый старт")}
      >
        <QuickStart onSelect={selectPage} />
        <section className="connect-card flex flex-col items-start gap-4 p-5 border border-line rounded-none bg-surface-soft mb-4">
          <h2>{t("Подключение устройств")}</h2>
          <p>{t("Подписки и QR-коды.")}</p>
          <Button
            variant="secondary"
            aria-label={t("Пользователи: открыть список")}
            onClick={() => selectPage("users")}
          >
            {t("Пользователи")}
          </Button>
        </section>
      </div>
    </>
  );
}
