import { CloudForm } from "@/components/admin/cloud/CloudForm";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { QueryState } from "@/components/ui/loading";
import { useCloudPassword } from "@/hooks/admin/use-cloud-password";
import { useTranslation } from "react-i18next";

export function CloudSettings() {
  const { t } = useTranslation();
  const query = useCloudPassword();
  return (
    <SettingsSection
      id="cloud-password"
      title={t("Облачный пароль")}
      action={<span>{t(query.data?.enabled ? "Включён" : "Выключен")}</span>}
    >
      <div className="form-body">
        <p className="caption">
          {t("Дополнительный пароль, который запрашивается после основного пароля при каждом входе.")}
        </p>
        <QueryState isLoading={query.isPending} error={query.error} />
        {query.error && (
          <button type="button" className="secondary" onClick={() => void query.refetch()}>
            {t("Повторить")}
          </button>
        )}
        {query.data && !query.error && (
          <CloudForm key={String(query.data.enabled)} isEnabled={query.data.enabled} />
        )}
      </div>
    </SettingsSection>
  );
}
