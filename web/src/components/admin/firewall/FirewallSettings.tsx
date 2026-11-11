import { Caption } from "@/components/elements/Caption";
import { Button } from "@/components/ui/button/Button";
import { CardBody } from "@/components/ui/cards/CardBody";
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
        <Button
          type="button"
          aria-label={t("Проверить firewall")}
          variant="secondary"
          onClick={() => read.mutate()}
          disabled={read.isPending || change.isPending}
        >
          {t("Проверить")}
        </Button>
      }
    >
      <CardBody>
        <Notice variant="warning">
          {t(
            "Опубликованные порты Docker могут обходить UFW. Панель не выдаёт такие порты за закрытые. Firewall хостинга настраивается отдельно.",
          )}
        </Notice>
        <PortGuide />
        <Caption>
          {t("Правила UFW для входящих TCP/UDP-портов Ubuntu. Порты SSH и панели защищены от закрытия.")}
        </Caption>
        {!result && (
          <div className="firewall-helper grid gap-2">
            <Caption>{t("Для подключения помощника выполните на сервере:")}</Caption>
            <CommandBlock command="sudo hy2-panel firewall-setup" />
          </div>
        )}
        {result && (
          <>
            <p>{t(result.active ? "UFW включён" : "UFW выключен. Изменение правил недоступно.")}</p>
            <pre className="logs m-0 bg-input overflow-auto whitespace-pre-wrap wrap-anywhere">
              {result.output}
            </pre>
            {!!result.protectedPorts?.length && (
              <Caption>
                {t("Защищённые TCP-порты:")} {result.protectedPorts.join(", ")}
              </Caption>
            )}
          </>
        )}
        {result?.active && (
          <PortRuleForm
            isPending={change.isPending || read.isPending}
            onApply={(rule) => change.mutate(rule)}
          />
        )}
      </CardBody>
    </SettingsSection>
  );
}
