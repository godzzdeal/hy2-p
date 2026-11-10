import { Caption } from "@/components/elements/Caption";
import { CardBody } from "@/components/ui/cards/CardBody";
import { Button } from "@/components/ui/button/Button";
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
      <CardBody>
        <Caption>
          {t("Дополнительный пароль, который запрашивается после основного пароля при каждом входе.")}
        </Caption>
        <QueryState isLoading={query.isPending} error={query.error} />
        {query.error && (
          <Button type="button" variant="secondary" onClick={() => void query.refetch()}>
            {t("Повторить")}
          </Button>
        )}
        {query.data && !query.error && (
          <CloudForm key={String(query.data.enabled)} isEnabled={query.data.enabled} />
        )}
      </CardBody>
    </SettingsSection>
  );
}
