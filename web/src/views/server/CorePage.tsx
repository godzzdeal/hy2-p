"use client";
import { CoreLog } from "@/components/core/logs/CoreLog";
import { CoreStatusCard } from "@/components/core/status/CoreStatusCard";
import { UpdateCard } from "@/components/core/versions/UpdateCard";
import { ArrowUpRight } from "@/components/elements/icons";
import { useTranslation } from "react-i18next";
export function CorePage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-heading flex justify-between items-start gap-4 mb-5 max-tablet:flex-col max-tablet:items-start">
        <div>
          <span className="eyebrow tracking-normal">{t("СИСТЕМА / HYSTERIA 2")}</span>
          <h1>{t("Управление HY2")}</h1>
        </div>
        <a
          className="documentation-link flex items-center gap-2 text-lg no-underline whitespace-nowrap py-3 px-0"
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
        data-scroll-label={t("Обновление экземпляра")}
      >
        <UpdateCard />
      </div>
    </>
  );
}
