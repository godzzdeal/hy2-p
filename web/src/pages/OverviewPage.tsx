import { QueryState } from "@/components/ui/loading";
import { SystemOverview } from "@/components/overview/system";
import { useConfiguration } from "@/hooks/configuration/use-configuration";
import { useCore } from "@/hooks/core/use-core";
import { useUsers } from "@/hooks/users/user-queries";
import { isUserActive } from "@/services/users/user-types";
import { useUiStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";
export function OverviewPage() {
  const { t } = useTranslation();
  const users = useUsers();
  const config = useConfiguration();
  const core = useCore();
  const selectPage = useUiStore((state) => state.selectPage);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t("Ваш сервер")}</h1>
        </div>
      </div>
      <QueryState
        isLoading={users.isPending || config.isPending || core.isPending}
        error={users.error || config.error || core.error}
      />
      <div
        className="metrics"
        id="overview-status"
        data-scroll-section
        data-scroll-label={t("Состояние экземпляра")}
      >
        <section className="metric">
          <div>{t("Состояние экземпляра")}</div>
          <strong>{core.data?.running ? t("Запущено") : t("Остановлено")}</strong>
          <small>
            {core.data?.available
              ? t("Hysteria2 установлен")
              : t("Установите HY2 в разделе «Управление HY2».")}
          </small>
        </section>
        <section className="metric">
          <div>{t("Пользователи")}</div>
          <strong>{users.data?.length ?? 0}</strong>
          <small>
            {users.data?.filter(isUserActive).length ?? 0} {t("с активным доступом")}
          </small>
        </section>
        <section className="metric">
          <div>{t("Адрес подключения")}</div>
          <strong className="host-value">{config.data?.host || t("Не настроен")}</strong>
          <small>UDP / {config.data?.port || "8443"}</small>
        </section>
      </div>
      <SystemOverview />
      <div
        className="overview-grid"
        id="overview-start"
        data-scroll-section
        data-scroll-label={t("Быстрый старт")}
      >
        <section className="card">
          <div className="card-header">
            <h2>{t("Быстрый старт")}</h2>
          </div>
          <div className="steps">
            <button className="step" onClick={() => selectPage("config")}>
              <span className="step-number">01</span>
              <span>
                <strong>{t("Настройте сервер")}</strong>
                <small>{t("Публичный адрес, порт и TLS-сертификат.")}</small>
              </span>
            </button>
            <button className="step" onClick={() => selectPage("core")}>
              <span className="step-number">02</span>
              <span>
                <strong>{t("Запустите Hysteria2")}</strong>
                <small>{t("Проверьте журнал запуска.")}</small>
              </span>
            </button>
            <button className="step" onClick={() => selectPage("users")}>
              <span className="step-number">03</span>
              <span>
                <strong>{t("Подключите устройство")}</strong>
                <small>{t("Создайте пользователя и получите QR-код.")}</small>
              </span>
            </button>
          </div>
        </section>
        <section className="connect-card">
          <span className="eyebrow">{t("ПРОСТОЕ ПОДКЛЮЧЕНИЕ")}</span>
          <h2>
            {t("Одна ссылка.")}
            <br />
            {t("И вы в сети.")}
          </h2>
          <p>{t("Персональные URL и QR-коды для Happ.")}</p>
          <button className="secondary" onClick={() => selectPage("users")}>
            {t("К пользователям")}
          </button>
        </section>
      </div>
    </>
  );
}
