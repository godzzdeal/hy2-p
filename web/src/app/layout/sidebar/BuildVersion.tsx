import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES, QUERY_KEYS, request } from "@/shared/http";
interface IBuildVersion {
  version: string;
  revision: string;
}
export function BuildVersion() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: QUERY_KEYS.panelVersion,
    queryFn: () => request<IBuildVersion>(API_ROUTES.panelVersion),
  });
  return (
    <output
      aria-label={t("Версия панели")}
      title={query.data ? t("Сборка") + ": " + query.data.revision : undefined}
    >
      {query.data?.version ?? t(query.error ? "Версия недоступна" : "Проверяем версию…")}
    </output>
  );
}
