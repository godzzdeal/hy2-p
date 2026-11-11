import { Caption } from "@/components/elements/Caption";
import { CommandBlock } from "@/components/elements/copy";
import { PORT_PURPOSES } from "@/services/admin/firewall/ports";
import { type IPortSummary } from "@/services/admin/firewall/recommendations";
import { useTranslation } from "react-i18next";
export function PortRow({ port }: { port: IPortSummary }) {
  const { t } = useTranslation();
  const command = `sudo ufw insert 1 allow ${port.port}/${port.protocol}`;
  return (
    <li className="firewall-port-row grid-cols-2 items-center py-2 px-3 border border-line min-w-0 bg-input max-tablet:grid-cols-1">
      <div className="firewall-port-info grid items-center gap-3 min-w-0 max-tablet:gap-2">
        <strong className="firewall-port-number text-accent whitespace-nowrap max-tablet:justify-self-start max-tablet:py-1 max-tablet:px-2 max-tablet:border max-tablet:border-line max-tablet:bg-surface-soft">
          {port.port}/{port.protocol.toUpperCase()}
        </strong>
        <div className="firewall-port-description grid min-w-0 gap-1 wrap-anywhere">
          <span>{port.purposes.map((purpose) => t(PORT_PURPOSES[purpose])).join(", ")}</span>
          <small>{port.sources.join(", ")}</small>
          {port.pending && (
            <Caption>{t("Изменение ещё нужно применить или опубликовать порт Docker.")}</Caption>
          )}
        </div>
      </div>
      <CommandBlock
        command={command}
        label={t("Команда открытия порта")}
        copyLabel={t("Скопировать команду для {{port}}", {
          port: `${port.port}/${port.protocol}`,
        })}
      />
    </li>
  );
}
