import { Button } from "@/components/ui/button/Button";
import { Check, X, TriangleAlert } from "@/components/elements/icons";
import { NETWORK } from "@/config/network";
import { useNotifications, type INotification } from "@/store/notifications";
import { cn } from "@/utils/cn";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
export function Notification({ item }: { item: INotification }) {
  const { t } = useTranslation();
  const dismiss = useNotifications((state) => state.dismiss);
  useEffect(() => {
    if (item.isError) return;
    const timer = setTimeout(() => dismiss(item.id), NETWORK.noticeMs);
    return () => clearTimeout(timer);
  }, [item.id, item.isError, dismiss]);
  const Icon = item.isError ? TriangleAlert : Check;
  return (
    <div
      className={cn(
        "notification grid gap-3 p-4 bg-surface text-foreground border border-accent shadow-popup wrap-anywhere",
        { "notification-error border-danger": item.isError },
      )}
      role={item.isError ? "alert" : "status"}
    >
      <Icon width={24} height={24} aria-hidden />
      <span>{t(item.message)}</span>
      <Button
        type="button"
        size="icon"
        aria-label={t("Закрыть уведомление")}
        onClick={() => dismiss(item.id)}
      >
        <X width={24} height={24} aria-hidden />
      </Button>
    </div>
  );
}
