import { CardBody } from "@/components/ui/cards/CardBody";
import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { CertificateFields } from "@/components/admin/CertificateFields";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { NetworkFields } from "@/components/admin/listener/NetworkFields";
import { useSaveWeb } from "@/hooks/admin/use-admin";
import { type IWebSettings } from "@/services/admin/admin-types";
import { updateWebConfig } from "@/utils/admin/web-config";
import { useState, type FormEvent } from "react";
import { RestartDialog } from "@/components/admin/maintenance/RestartDialog";
import { useTranslation } from "react-i18next";
export function WebForm({ initial }: { initial: IWebSettings }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => updateWebConfig(initial.config, initial.config));
  const mutation = useSaveWeb();
  const [isRestartOpen, setRestartOpen] = useState(false);
  const current = mutation.data ?? initial;
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(draft, { onSuccess: (result) => setRestartOpen(result.restartRequired) });
  }
  return (
    <SettingsSection id="panel-network" title={t("Настройки панели")}>
      <form className="settings-form" onSubmit={onSubmit}>
        {current.restartRequired && (
          <CardBody>
            <Notice variant="warning">
              <strong>{t("Нужен перезапуск панели")}</strong>
              <p>
                {t(
                  "Текущий адрес продолжает работать до перезапуска. После него используйте новый порт и протокол.",
                )}
              </p>
              <Button type="button" onClick={() => setRestartOpen(true)}>
                {t("Перезапустить панель")}
              </Button>
            </Notice>
          </CardBody>
        )}
        <NetworkFields value={draft} onChange={(next) => setDraft(updateWebConfig(draft, next))} />
        <CertificateFields
          value={draft}
          onChange={(next) => setDraft(updateWebConfig(draft, next))}
          hasPrivateKey={current.hasPrivateKey}
        />
        <CardBody>
          <Button
            aria-label={t("Сохранить настройки веб-панели")}
            variant="primary"
            disabled={mutation.isPending}
          >
            {t("Сохранить")}
          </Button>
        </CardBody>
      </form>
      {isRestartOpen && (
        <RestartDialog targetURL={current.config.publicURL} onClose={() => setRestartOpen(false)} />
      )}
    </SettingsSection>
  );
}
