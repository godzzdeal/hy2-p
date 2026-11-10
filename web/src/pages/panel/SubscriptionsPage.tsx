import { AnnouncementSettings } from "@/components/admin/announcement/AnnouncementSettings";
import { useTranslation } from "react-i18next";
export function SubscriptionsPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-heading flex justify-between items-start gap-4 mb-5 max-tablet:flex-col max-tablet:items-start">
        <div>
          <h1>{t("Подписки")}</h1>
        </div>
      </div>
      <AnnouncementSettings />
    </>
  );
}
