import { Copy } from "@/components/elements/icons";
import { PORT_PURPOSES, type IRecommendedPort } from "@/services/admin/firewall/ports";
import { useUiStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";
export function PortRow({ port }: { port: IRecommendedPort }) {
  const { t } = useTranslation();
  const { notify, showError } = useUiStore();
  const command = `sudo ufw insert 1 allow ${port.port}/${port.protocol}`;
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command);
      notify("Скопировано");
    } catch (error) {
      showError(error);
    }
  }
  return (
    <li className="firewall-port-row">
      <div>
        <strong>
          {port.port}/{port.protocol.toUpperCase()}
        </strong>
        <span>{port.source}</span>
        <p className="caption">{t(PORT_PURPOSES[port.purpose])}</p>
        {port.pending && (
          <p className="caption">{t("Изменение ещё нужно применить или опубликовать порт Docker.")}</p>
        )}
      </div>
      <div className="firewall-command">
        <code>{command}</code>
        <button
          type="button"
          className="icon-btn secondary"
          aria-label={t("Скопировать команду для {{port}}", { port: `${port.port}/${port.protocol}` })}
          onClick={() => void onCopy()}
        >
          <Copy width={24} height={24} aria-hidden />
        </button>
      </div>
    </li>
  );
}
