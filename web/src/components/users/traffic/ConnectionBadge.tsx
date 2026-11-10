import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
export function ConnectionBadge({
  online,
  isAvailable,
  isBlocked = false,
}: {
  online: number;
  isAvailable: boolean;
  isBlocked?: boolean;
}) {
  const { t } = useTranslation();
  const isOnline = !isBlocked && isAvailable && online > 0;
  const label =
    t(isBlocked ? "Отключено" : !isAvailable ? "Нет данных" : isOnline ? "В сети" : "Не в сети") +
    (isOnline && online > 1 ? ` (${online})` : "");
  return (
    <span
      className={cn("connection-indicator inline-grid place-items-center align-middle", {
        "is-online": isOnline,
        "is-unknown": !isAvailable && !isBlocked,
      })}
      role="img"
      aria-label={label}
      title={label}
      tabIndex={0}
    />
  );
}
