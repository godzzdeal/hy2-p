"use client";
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
      <div className="page-heading flex justify-between items-start gap-4 mb-5 max-tablet:flex-col max-tablet:items-start">
        <div>
          <span className="eyebrow tracking-normal">{t("УПРАВЛЕНИЕ ПАНЕЛЬЮ")}</span>
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
