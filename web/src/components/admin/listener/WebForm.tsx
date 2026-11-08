import { CertificateFields } from "@/components/admin/CertificateFields";
import { NetworkFields } from "@/components/admin/listener/NetworkFields";
import { useSaveWeb } from "@/hooks/admin/use-admin";
import { type IWebSettings } from "@/services/admin/admin-types";
import { updateWebConfig } from "@/utils/admin/web-config";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
export function WebForm({ initial }: { initial: IWebSettings }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initial.config);
  const mutation = useSaveWeb();
  const current = mutation.data ?? initial;
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(draft);
  }
  return (
    <form
      className="card settings-form"
      onSubmit={onSubmit}
      id="panel-network"
      data-scroll-section
      data-scroll-label={t("Порт, домен и HTTPS веб-панели")}
    >
      <div className="card-header">
        <h2>{t("Порт, домен и HTTPS веб-панели")}</h2>
      </div>
      <NetworkFields value={draft} onChange={(next) => setDraft(updateWebConfig(draft, next))} />
      <CertificateFields
        value={draft}
        onChange={(next) => setDraft(updateWebConfig(draft, next))}
        hasPrivateKey={current.hasPrivateKey}
      />
      <div className="form-body">
        <button className="primary" disabled={mutation.isPending}>
          {t("Сохранить настройки веб-панели")}
        </button>
        {current.restartRequired && (
          <div className="info-note">
            <strong>{t("Нужен перезапуск панели")}</strong>
            <p>
              {t(
                "Текущий адрес продолжает работать до перезапуска. После него используйте новый порт и протокол.",
              )}
            </p>
            {current.container && (
              <p>
                {t(
                  "В Docker также измените опубликованный порт в Compose: PANEL_PORT должен соответствовать выбранному порту.",
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
