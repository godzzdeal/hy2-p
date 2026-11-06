import { useTranslation } from "react-i18next";
import { AnnouncementSettings } from "@/features/admin/announcement";
export function SubscriptionsPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t("Подписки")}</h1>
          <p>{t("Название, флаг и сообщения для пользователей Happ.")}</p>
        </div>
      </div>
      <AnnouncementSettings />
    </>
  );
}
