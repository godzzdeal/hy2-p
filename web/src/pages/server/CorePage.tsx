import { CoreLog } from "@/components/core/logs/CoreLog";
import { CoreStatusCard } from "@/components/core/status/CoreStatusCard";
import { UpdateCard } from "@/components/core/versions/UpdateCard";
import { ArrowUpRight } from "@/components/elements/icons";
import { useTranslation } from "react-i18next";
export function CorePage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("СИСТЕМА / HYSTERIA 2")}</span>
          <h1>{t("Ядро и журнал")}</h1>
          <p>{t("Запуск, журнал и обновление Hysteria2.")}</p>
        </div>
        <a
          className="documentation-link"
          href="https://v2.hysteria.network/docs/getting-started/Installation/"
          target="_blank"
          rel="noreferrer"
        >
          {t("Документация")}
          <ArrowUpRight width={24} height={24} aria-hidden />
        </a>
      </div>
      <CoreStatusCard />
      <CoreLog />
      <div
        className="min-w-0"
        id="core-versions"
        data-scroll-section
        data-scroll-label={t("Обновление ядра")}
      >
        <UpdateCard />
      </div>
    </>
  );
}
