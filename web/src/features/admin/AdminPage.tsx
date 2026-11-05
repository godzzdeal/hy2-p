import { useTranslation } from "react-i18next";
import { AnnouncementSettings } from "./announcement";
import { AccountSettings } from "./account";
import { WebSettings } from "./listener";
export function AdminPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("УПРАВЛЕНИЕ ПАНЕЛЬЮ")}</span>
          <h1>{t("Настройки панели")}</h1>
          <p>{t("Учётная запись, сетевой адрес и сертификат веб-интерфейса.")}</p>
        </div>
      </div>
      <AccountSettings />
      <WebSettings />
      <AnnouncementSettings />
    </>
  );
}
