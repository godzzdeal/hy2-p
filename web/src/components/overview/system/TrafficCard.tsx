import { Card } from "@/components/ui/cards/Card";
import { CardHeader } from "@/components/ui/cards/CardHeader";
import { CardBody } from "@/components/ui/cards/CardBody";
import { ByteRow } from "@/components/overview/system/storage/ByteRow";
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
        <ByteRow
          label="Отправлено пользователями"
          bytes={upload}
          direction="transmit"
          isAvailable={isAvailable}
        />
        <ByteRow
          label="Получено пользователями"
          bytes={download}
          direction="receive"
          isAvailable={isAvailable}
        />
        <ByteRow label="Получено с запуска" bytes={received} direction="receive" />
        <ByteRow label="Отправлено с запуска" bytes={transmitted} direction="transmit" />
      </CardBody>
    </Card>
  );
}
