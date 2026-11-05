import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { CoreStatusCard, CoreLog } from "./status";
import { UpdateCard } from "./versions";
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
          href="https://v2.hysteria.network/docs/"
          target="_blank"
          rel="noreferrer"
        >
          {t("Документация")}
          <ArrowUpRight size={20} aria-hidden />
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
