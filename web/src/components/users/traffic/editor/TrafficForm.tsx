import { Caption } from "@/components/elements/Caption";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
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
      <Notice>
        {t("Использовано:")} {formatBytes(usage.upload + usage.download, t)}
        {t(". При исчерпании квоты доступ блокируется до её увеличения или сброса счётчиков.")}
      </Notice>
      {!!usage.groupLimit && (
        <Notice>
          {t("Лимит группы:")} {formatBytes(usage.groupLimit, t)}.{" "}
          {t("Личный лимит может быть только строже.")}
        </Notice>
      )}
      <Field>
        {t("Единица измерения")}
        <Select value={unit} onValueChange={(nextValue) => setUnit(Number(nextValue))}>
          <SelectOption value={BYTE_UNITS.byte}>{t("Б")}</SelectOption>
          <SelectOption value={BYTE_UNITS.kilobyte}>{t("КБ")}</SelectOption>
          <SelectOption value={BYTE_UNITS.megabyte}>{t("МБ")}</SelectOption>
          <SelectOption value={BYTE_UNITS.gigabyte}>{t("ГБ")}</SelectOption>
          <SelectOption value={BYTE_UNITS.terabyte}>{t("ТБ")}</SelectOption>
        </Select>
      </Field>
      <Field>
        {t("Отправлено клиентом")}
        <Input
          type="number"
          min={0}
          max={Number.MAX_SAFE_INTEGER / unit}
          step="any"
          required
          value={(upload ?? usage.upload) / unit}
          onChange={(event) => setUpload(Math.round(Number(event.target.value) * unit))}
        />
      </Field>
      <Field>
        {t("Получено клиентом")}
        <Input
          type="number"
          min={0}
          step="any"
          required
          value={(download ?? usage.download) / unit}
          onChange={(event) => setDownload(Math.round(Number(event.target.value) * unit))}
        />
      </Field>
      <Field>
        {t("Лимит трафика (0 без ограничений)")}
        <Input
          type="number"
          min={0}
          step="any"
          required
          value={limit / unit}
          onChange={(event) => setLimit(Math.round(Number(event.target.value) * unit))}
        />
      </Field>
      <Actions>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setUpload(0);
            setDownload(0);
          }}
        >
          {t("Сбросить счётчики")}
        </Button>
        <Button aria-label={t("Сохранить трафик")} variant="primary" disabled={mutation.isPending}>
          {t("Сохранить")}
        </Button>
      </Actions>
      <Caption>{t("Трафик обновляется раз в 5 секунд.")}</Caption>
    </form>
  );
}
