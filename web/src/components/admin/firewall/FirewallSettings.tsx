import { Notice } from "@/components/ui/feedback";
import { PortRuleForm } from "@/components/admin/firewall/PortRuleForm";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { PortGuide } from "@/components/admin/firewall/ports/PortGuide";
import { CommandBlock } from "@/components/elements/copy";
import { useFirewall } from "@/hooks/admin/firewall/use-firewall";
import { useTranslation } from "react-i18next";
export function FirewallSettings() {
  const { t } = useTranslation();
  const { read, change } = useFirewall();
  const result = read.data;
  return (
    <SettingsSection
      id="panel-firewall"
      title="Firewall"
      action={
        <button
          type="button"
          aria-label={t("Проверить firewall")}
          className="secondary"
          onClick={() => read.mutate()}
          disabled={read.isPending || change.isPending}
        >
          {t("Проверить")}
        </button>
      }
    >
      <div className="form-body">
        <PortGuide />
        <p className="caption">
          {t("Правила UFW для входящих TCP/UDP-портов Ubuntu. Порты SSH и панели защищены от закрытия.")}
        </p>
        <Notice>
          {t(
            "Опубликованные порты Docker могут обходить UFW. Панель не выдаёт такие порты за закрытые. Firewall хостинга настраивается отдельно.",
          )}
        </Notice>
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
    </SettingsSection>
  );
}
