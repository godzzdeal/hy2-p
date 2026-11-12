"use client";
import { ConfigurationEditor } from "@/components/configuration/editor/draft/ConfigurationEditor";
import { QueryState } from "@/components/ui/loading";
import { useConfiguration } from "@/hooks/configuration/use-configuration";
import { useTranslation } from "react-i18next";
export default function ConfigurationPage() {
  const { t } = useTranslation();
  const query = useConfiguration();
  return (
    <>
      <div className="page-heading flex justify-between items-start gap-4 mb-5 max-tablet:flex-col max-tablet:items-start">
        <div>
          <h1>{t("Конфигурация сервера")}</h1>
          <p>{t("Параметры подключения")}</p>
        </div>
      </div>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && <ConfigurationEditor initial={query.data} />}
    </>
  );
}
