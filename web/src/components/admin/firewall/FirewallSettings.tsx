import { PortRuleForm } from "@/components/admin/firewall/PortRuleForm";
import { PortGuide } from "@/components/admin/firewall/ports/PortGuide";
import { CommandBlock } from "@/components/elements/CommandBlock";
import { useFirewall } from "@/hooks/admin/firewall/use-firewall";
import { useTranslation } from "react-i18next";
export function FirewallSettings() {
  const { t } = useTranslation();
  const { read, change } = useFirewall();
  const result = read.data;
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
          <div className="firewall-helper">
            <p className="caption">{t("Для подключения помощника выполните на сервере:")}</p>
            <CommandBlock command="sudo hy2-panel firewall-setup" />
          </div>
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
