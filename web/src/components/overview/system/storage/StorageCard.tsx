import { Caption } from "@/components/elements/Caption";
import { Card } from "@/components/ui/cards/Card";
import { CardHeader } from "@/components/ui/cards/CardHeader";
import { CardBody } from "@/components/ui/cards/CardBody";
import { ByteRow } from "@/components/overview/system/storage/ByteRow";
import { storageItems } from "@/components/overview/system/storage/storage-items";
import { type ISystemStorage } from "@/services/admin/maintenance";
import { formatBytes } from "@/services/users/traffic/traffic-types";
import { useTranslation } from "react-i18next";

export function StorageCard({ value, isHost }: { value: ISystemStorage; isHost: boolean }) {
  const { t } = useTranslation();
  const items = storageItems(value);
  const total = items.reduce((sum, item) => sum + item.bytes, 0);
  return (
    <Card className="system-storage">
      <CardHeader>
        <h3>{t("Место на диске")}</h3>
        <strong>{value.updated ? "≈ " + formatBytes(total, t) : t("Подсчёт…")}</strong>
      </CardHeader>
      <CardBody className="gap-1">
        {items.map((item) => (
          <ByteRow key={item.label} {...item} />
        ))}
        {!isHost && (
          <small className="muted">
            {t("Показан размер данных панели. Для подсчёта бэкапов и образов нужен помощник Docker.")}
          </small>
        )}
        {value.message && <Caption>{t(value.message)}</Caption>}
      </CardBody>
    </Card>
  );
}
