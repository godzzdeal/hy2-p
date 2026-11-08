import { useBuildVersion } from "@/hooks/panel/use-build-version";
import { useTranslation } from "react-i18next";

export function BuildVersion() {
  const { t } = useTranslation();
  const query = useBuildVersion();
  return (
    <output
      aria-label={t("Версия панели")}
      title={query.data ? t("Сборка") + ": " + query.data.revision : undefined}
    >
      {query.data?.version ?? t(query.error ? "Версия недоступна" : "Проверяем версию…")}
    </output>
  );
}
