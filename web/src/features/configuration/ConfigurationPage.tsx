import { useTranslation } from "react-i18next";
import { useConfiguration } from "./model";
import { ConfigurationEditor } from "./editor";
import { QueryState } from "@/shared/ui";
export function ConfigurationPage() {
  const { t } = useTranslation();
  const query = useConfiguration();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t("Конфигурация сервера")}</h1>
          <p>{t("Параметры подключения и полный YAML.")}</p>
        </div>
      </div>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && <ConfigurationEditor initial={query.data} />}
    </>
  );
}
