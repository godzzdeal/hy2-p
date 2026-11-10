import { Card } from "@/components/ui/cards/Card";
import { CardHeader } from "@/components/ui/cards/CardHeader";
import { CardBody } from "@/components/ui/cards/CardBody";
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
    <Card>
      <CardHeader>
        <h3>{t("Трафик")}</h3>
      </CardHeader>
      <CardBody className="gap-1">
        <div className="system-storage-row flex items-baseline justify-between gap-3 min-w-0">
          <span>{t("Отправлено пользователями")}</span>
          <strong>{isAvailable ? "↑ " + formatBytes(upload, t) : t("Недоступно")}</strong>
        </div>
        <div className="system-storage-row flex items-baseline justify-between gap-3 min-w-0">
          <span>{t("Получено пользователями")}</span>
          <strong>{isAvailable ? "↓ " + formatBytes(download, t) : t("Недоступно")}</strong>
        </div>
        <div className="system-storage-row flex items-baseline justify-between gap-3 min-w-0">
          <span>{t("Получено с запуска")}</span>
          <strong>↓ {formatBytes(received, t)}</strong>
        </div>
        <div className="system-storage-row flex items-baseline justify-between gap-3 min-w-0">
          <span>{t("Отправлено с запуска")}</span>
          <strong>↑ {formatBytes(transmitted, t)}</strong>
        </div>
      </CardBody>
    </Card>
  );
}
