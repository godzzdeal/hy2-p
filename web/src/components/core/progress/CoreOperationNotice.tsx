import { Loader } from "@/components/ui/loading";
import { useTranslation } from "react-i18next";
export function CoreOperationNotice({ label }: { label: string }) {
  const { t } = useTranslation();
  return (
    <div
      className="notification gap-3 p-4 bg-surface text-foreground border border-accent shadow-popup wrap-anywhere notification-progress block pointer-events-none"
      aria-label={t("Управление экземпляром")}
    >
      <Loader label={label} isInline />
    </div>
  );
}
