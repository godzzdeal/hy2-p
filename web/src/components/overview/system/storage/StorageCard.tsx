import { StorageRow } from "@/components/overview/system/storage/StorageRow";
import { storageItems } from "@/components/overview/system/storage/storage-items";
import { type ISystemStorage } from "@/services/admin/maintenance";
import { formatBytes } from "@/services/users/traffic/traffic-types";
import { useTranslation } from "react-i18next";

export function StorageCard({ value, isHost }: { value: ISystemStorage; isHost: boolean }) {
  const { t } = useTranslation();
  const items = storageItems(value);
  const total = items.reduce((sum, item) => sum + item.bytes, 0);
  return (
    <section className="card system-storage">
      <div className="card-header">
        <h3>{t("Место на диске")}</h3>
        <strong>{value.updated ? "≈ " + formatBytes(total, t) : t("Подсчёт…")}</strong>
      </div>
      <div className="form-body">
        {items.map((item) => (
          <StorageRow key={item.label} {...item} />
        ))}
        {!isHost && (
          <small className="muted">
            {t("Показан каталог данных панели. Для размеров бэкапов и образов нужен помощник Docker.")}
          </small>
        )}
        {value.message && <p className="caption">{t(value.message)}</p>}
      </div>
    </section>
  );
}
