import { Copy } from "@/components/elements/icons";
import { PORT_PURPOSES, type IRecommendedPort } from "@/services/admin/firewall/ports";
import { useUiStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";
import { useState } from "react";
export function PortRow({ port }: { port: IRecommendedPort }) {
  const { t } = useTranslation();
  const { notify } = useUiStore();
  const [isManual, setManual] = useState(false);
  const command = `sudo ufw insert 1 allow ${port.port}/${port.protocol}`;
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command);
      notify("Скопировано");
    } catch {
      setManual(true);
      notify("Скопируйте команду вручную");
    }
  }
  return (
    <li className="firewall-port-row">
      <strong>
        {port.port}/{port.protocol.toUpperCase()}
      </strong>
      <div className="firewall-port-description">
        <span>{t(PORT_PURPOSES[port.purpose])}</span>
        <small>{port.source}</small>
        {port.pending && (
          <p className="caption">{t("Изменение ещё нужно применить или опубликовать порт Docker.")}</p>
        )}
      </div>
      <button
        type="button"
        className="icon-btn secondary"
        aria-label={t("Скопировать команду для {{port}}", { port: `${port.port}/${port.protocol}` })}
        title={command}
        onClick={() => void onCopy()}
      >
        <Copy width={24} height={24} aria-hidden />
      </button>
      {isManual && (
        <input
          className="firewall-manual-command"
          readOnly
          value={command}
          aria-label={t("Команда открытия порта")}
          onFocus={(event) => event.target.select()}
        />
      )}
    </li>
  );
}
