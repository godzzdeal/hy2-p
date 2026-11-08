import { CommandBlock } from "@/components/elements/CommandBlock";
import { PORT_PURPOSES } from "@/services/admin/firewall/ports";
import { type IPortSummary } from "@/services/admin/firewall/recommendations";
import { useTranslation } from "react-i18next";
export function PortRow({ port }: { port: IPortSummary }) {
  const { t } = useTranslation();
  const command = `sudo ufw insert 1 allow ${port.port}/${port.protocol}`;
  return (
    <li className="firewall-port-row">
      <div className="firewall-port-info">
        <strong className="firewall-port-number">
          {port.port}/{port.protocol.toUpperCase()}
        </strong>
        <div className="firewall-port-description">
          <span>{port.purposes.map((purpose) => t(PORT_PURPOSES[purpose])).join(", ")}</span>
          <small>{port.sources.join(", ")}</small>
          {port.pending && (
            <p className="caption">{t("Изменение ещё нужно применить или опубликовать порт Docker.")}</p>
          )}
        </div>
      </div>
      <CommandBlock
        command={command}
        label={t("Команда открытия порта")}
        copyLabel={t("Скопировать команду для {{port}}", { port: `${port.port}/${port.protocol}` })}
      />
    </li>
  );
}
