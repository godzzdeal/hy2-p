import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib";
export function ConnectionBadge({ online, isAvailable }: { online: number; isAvailable: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={cn("badge", isAvailable && online > 0 ? "green" : "gray")}>
      <i />
      {!isAvailable ? t("Нет данных") : online > 0 ? t("В сети") : t("Не в сети")}
      {isAvailable && online > 1 && <> · {online}</>}
    </span>
  );
}
