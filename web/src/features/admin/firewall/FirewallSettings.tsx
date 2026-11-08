import { useTranslation } from "react-i18next";
import { useFirewall } from "./model";
import { PortRuleForm } from "./PortRuleForm";
import { PortGuide } from "./ports";
export function FirewallSettings() {
  const { t } = useTranslation();
  const { read, change } = useFirewall();
  const result = read.data;
  const error = read.error ?? change.error;
  return (
    <section className="card settings-form">
      <div className="card-header">
        <h2>{t("Firewall сервера")}</h2>
        <button
          type="button"
          className="secondary"
          onClick={() => read.mutate()}
          disabled={read.isPending || change.isPending}
        >
          {t("Проверить UFW")}
        </button>
      </div>
      <div className="form-body">
        <PortGuide />
        <p className="caption">
          {t("Правила UFW для входящих TCP/UDP-портов Ubuntu. Порты SSH и панели защищены от закрытия.")}
        </p>
        <p className="config-note">
          {t(
            "Опубликованные порты Docker могут обходить UFW. Панель не выдаёт такие порты за закрытые. Firewall хостинга настраивается отдельно.",
          )}
        </p>
        {!result && (
          <p className="caption">
            {t("Для подключения помощника выполните на сервере: sudo hy2-panel firewall-setup")}
          </p>
        )}
        {error && (
          <p className="inline-error" role="alert">
            {t(error.message)}
          </p>
        )}
        {result && (
          <>
            <p>{t(result.active ? "UFW включён" : "UFW выключен. Изменение правил недоступно.")}</p>
            <pre className="logs">{result.output}</pre>
            {!!result.protectedPorts?.length && (
              <p className="caption">
                {t("Защищённые TCP-порты:")} {result.protectedPorts.join(", ")}
              </p>
            )}
          </>
        )}
        {result?.active && (
          <PortRuleForm
            isPending={change.isPending || read.isPending}
            onApply={(rule) => change.mutate(rule)}
          />
        )}
      </div>
    </section>
  );
}
