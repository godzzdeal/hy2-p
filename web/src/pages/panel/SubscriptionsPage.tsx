import { AnnouncementSettings } from "@/components/admin/announcement/AnnouncementSettings";
import { useTranslation } from "react-i18next";
export function SubscriptionsPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t("Подписки")}</h1>
        </div>
      </div>
      <AnnouncementSettings />
    </>
  );
}
