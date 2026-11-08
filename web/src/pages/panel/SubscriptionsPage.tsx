import { AnnouncementSettings } from "@/components/admin/announcement/AnnouncementSettings";
import { useTranslation } from "react-i18next";
export function SubscriptionsPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t("Подписки")}</h1>
          <p>{t("Название, эмодзи и объявления для пользователей Happ.")}</p>
        </div>
      </div>
      <AnnouncementSettings />
    </>
  );
}
