import { formatBytes } from "@/services/users/traffic/traffic-types";
import { useTranslation } from "react-i18next";

interface ITrafficCard {
  upload: number;
  download: number;
  received: number;
  transmitted: number;
  isAvailable: boolean;
}

export function TrafficCard({ upload, download, received, transmitted, isAvailable }: ITrafficCard) {
  const { t } = useTranslation();
  return (
    <section className="card">
      <div className="card-header">
        <h3>{t("Трафик")}</h3>
      </div>
      <div className="form-body">
        <div className="system-storage-row">
          <span>{t("VPN, отправлено пользователями")}</span>
          <strong>{isAvailable ? "↑ " + formatBytes(upload, t) : t("Недоступно")}</strong>
        </div>
        <div className="system-storage-row">
          <span>{t("VPN, получено пользователями")}</span>
          <strong>{isAvailable ? "↓ " + formatBytes(download, t) : t("Недоступно")}</strong>
        </div>
        <div className="system-storage-row">
          <span>{t("Сеть, получено с запуска")}</span>
          <strong>↓ {formatBytes(received, t)}</strong>
        </div>
        <div className="system-storage-row">
          <span>{t("Сеть, отправлено с запуска")}</span>
          <strong>↑ {formatBytes(transmitted, t)}</strong>
        </div>
      </div>
    </section>
  );
}
