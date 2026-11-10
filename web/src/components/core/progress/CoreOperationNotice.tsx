import { Loader } from "@/components/ui/loading";
import { useTranslation } from "react-i18next";
export function CoreOperationNotice({ label }: { label: string }) {
  const { t } = useTranslation();
  return (
    <div className="notification notification-progress" aria-label={t("Управление экземпляром")}>
      <Loader label={label} isInline />
    </div>
  );
}
