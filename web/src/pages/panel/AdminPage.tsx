import { AccountSettings } from "@/components/admin/account/AccountSettings";
import { CloudSettings } from "@/components/admin/cloud/CloudSettings";
import { FirewallSettings } from "@/components/admin/firewall/FirewallSettings";
import { WebSettings } from "@/components/admin/listener/WebSettings";
import { InstallCard } from "@/components/elements/install/InstallCard";
import { BuildVersion } from "@/components/layout/sidebar/BuildVersion";
import { useTranslation } from "react-i18next";
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
      <CloudSettings />
      <p className="muted">
        <BuildVersion />
      </p>
      <WebSettings />
      <FirewallSettings />
      <InstallCard />
    </>
  );
}
