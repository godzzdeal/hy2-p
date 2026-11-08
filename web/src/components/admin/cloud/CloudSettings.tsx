import { CloudForm } from "@/components/admin/cloud/CloudForm";
import { QueryState } from "@/components/ui/QueryState";
import { useCloudPassword } from "@/hooks/admin/use-cloud-password";
import { useTranslation } from "react-i18next";

export function CloudSettings() {
  const { t } = useTranslation();
  const query = useCloudPassword();
  return (
    <section
      className="card"
      id="cloud-password"
      data-scroll-section
      data-scroll-label={t("Облачный пароль")}
    >
      <div className="card-header">
        <h2>{t("Облачный пароль")}</h2>
        <span>{t(query.data?.enabled ? "Включён" : "Не включён")}</span>
      </div>
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
    </section>
  );
}
