import { AccountSettings } from "@/components/admin/account/AccountSettings";
import { RestartSettings } from "@/components/admin/maintenance";
import { TransferSettings } from "@/components/admin/transfer";
import { CloudSettings } from "@/components/admin/cloud/CloudSettings";
import { FirewallSettings } from "@/components/admin/firewall/FirewallSettings";
import { WebSettings } from "@/components/admin/listener/WebSettings";
import { useTranslation } from "react-i18next";
export function AdminPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("УПРАВЛЕНИЕ ПАНЕЛЬЮ")}</span>
          <h1>{t("Настройки панели")}</h1>
        </div>
      </div>
      <AccountSettings />
      <CloudSettings />
      <TransferSettings />
      <WebSettings />
      <FirewallSettings />
      <RestartSettings />
    </>
  );
}
