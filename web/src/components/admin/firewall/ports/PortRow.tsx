import { Caption } from "@/components/elements/Caption";
import { CommandBlock } from "@/components/elements/copy";
import { PORT_PURPOSES } from "@/services/admin/firewall/ports";
import { type IPortSummary } from "@/services/admin/firewall/recommendations";
import { useTranslation } from "react-i18next";
export function PortRow({ port }: { port: IPortSummary }) {
  const { t } = useTranslation();
  const command = `sudo ufw insert 1 allow ${port.port}/${port.protocol}`;
  return (
    <li className="firewall-port-row min-w-0">
      <CommandBlock
        command={command}
        label={`${port.port}/${port.protocol.toUpperCase()}`}
        description={
          <div className="grid gap-2">
            <p>{port.purposes.map((purpose) => t(PORT_PURPOSES[purpose])).join(", ")}</p>
            <p className="text-muted">{port.sources.join(", ")}</p>
          </div>
        }
        copyLabel={t("Скопировать команду для {{port}}", {
          port: `${port.port}/${port.protocol}`,
        })}
      />
      {port.pending && (
        <Caption className="text-warning">
          {t("Порт ещё не применён. Сохраните настройки и примените публикацию Docker.")}
        </Caption>
      )}
    </li>
  );
}
