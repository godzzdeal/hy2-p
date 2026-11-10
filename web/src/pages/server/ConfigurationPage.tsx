import { ConfigurationEditor } from "@/components/configuration/editor/draft/ConfigurationEditor";
import { QueryState } from "@/components/ui/loading";
import { useConfiguration } from "@/hooks/configuration/use-configuration";
import { useTranslation } from "react-i18next";
export function ConfigurationPage() {
  const { t } = useTranslation();
  const query = useConfiguration();
  return (
    <>
      <div className="page-heading">
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
