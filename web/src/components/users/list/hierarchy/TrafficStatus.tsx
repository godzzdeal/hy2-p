import { Caption } from "@/components/elements/Caption";
import { useTranslation } from "react-i18next";

export function TrafficStatus({ updated, error }: { updated: string; error?: string }) {
  const { t } = useTranslation();
  return (
    <Caption className="traffic-status px-4 py-3">
      {t(error ?? "") ||
        (updated
          ? t("Статистика: ") + new Date(updated).toLocaleTimeString()
          : t("Ожидание статистики экземпляра"))}
    </Caption>
  );
}
