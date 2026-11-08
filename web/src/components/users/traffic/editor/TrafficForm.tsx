import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useAdjustTraffic } from "@/hooks/users/traffic/use-traffic";
import { BYTE_UNITS, formatBytes, type IUserUsage } from "@/services/users/traffic/traffic-types";
import { type IUser } from "@/services/users/user-types";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
export function TrafficForm({
  user,
  usage,
  onClose,
}: {
  user: IUser;
  usage: IUserUsage;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [unit, setUnit] = useState<number>(BYTE_UNITS.gigabyte);
  const [upload, setUpload] = useState<number>();
  const [download, setDownload] = useState<number>();
  const [limit, setLimit] = useState(usage.limit);
  const mutation = useAdjustTraffic();
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ id: user.id, upload, download, limit }, { onSuccess: onClose });
  }
  return (
    <form onSubmit={onSubmit}>
      <p className="config-note">
        {t("Использовано:")} {formatBytes(usage.upload + usage.download, t)}
        {t(". При исчерпании квоты доступ блокируется до её увеличения или сброса счётчиков.")}
      </p>
      {!!usage.groupLimit && (
        <p className="config-note">
          {t("Лимит группы:")} {formatBytes(usage.groupLimit, t)}.{" "}
          {t("Личный лимит может быть только строже.")}
        </p>
      )}
      <label>
        {t("Единица измерения")}
        <Select value={unit} onValueChange={(nextValue) => setUnit(Number(nextValue))}>
          <SelectOption value={BYTE_UNITS.byte}>{t("Б")}</SelectOption>
          <SelectOption value={BYTE_UNITS.kilobyte}>{t("КБ")}</SelectOption>
          <SelectOption value={BYTE_UNITS.megabyte}>{t("МБ")}</SelectOption>
          <SelectOption value={BYTE_UNITS.gigabyte}>{t("ГБ")}</SelectOption>
          <SelectOption value={BYTE_UNITS.terabyte}>{t("ТБ")}</SelectOption>
        </Select>
      </label>
      <label>
        {t("Отправлено клиентом")}
        <input
          type="number"
          min={0}
          max={Number.MAX_SAFE_INTEGER / unit}
          step="any"
          required
          value={(upload ?? usage.upload) / unit}
          onChange={(event) => setUpload(Math.round(Number(event.target.value) * unit))}
        />
      </label>
      <label>
        {t("Получено клиентом")}
        <input
          type="number"
          min={0}
          step="any"
          required
          value={(download ?? usage.download) / unit}
          onChange={(event) => setDownload(Math.round(Number(event.target.value) * unit))}
        />
      </label>
      <label>
        {t("Лимит трафика (0 без ограничений)")}
        <input
          type="number"
          min={0}
          step="any"
          required
          value={limit / unit}
          onChange={(event) => setLimit(Math.round(Number(event.target.value) * unit))}
        />
      </label>
      <div className="row-actions">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setUpload(0);
            setDownload(0);
          }}
        >
          {t("Сбросить счётчики")}
        </button>
        <button className="primary" disabled={mutation.isPending}>
          {t("Сохранить трафик")}
        </button>
      </div>
      <p className="caption">
        {t(
          "Трафик обновляется раз в 5 секунд. При аварийном завершении ядра последние неопросенные байты могут не попасть в учёт.",
        )}
      </p>
    </form>
  );
}
