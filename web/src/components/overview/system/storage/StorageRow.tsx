import { formatBytes } from "@/services/users/traffic/traffic-types";
import { useTranslation } from "react-i18next";

export function StorageRow({ label, bytes }: { label: string; bytes: number }) {
  const { t } = useTranslation();
  return (
    <div className="system-storage-row">
      <span>{t(label)}</span>
      <strong>{formatBytes(bytes, t)}</strong>
    </div>
  );
}
