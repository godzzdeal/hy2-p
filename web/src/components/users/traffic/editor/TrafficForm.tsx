import { Caption } from "@/components/elements/Caption";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useTrafficForm } from "@/hooks/users/traffic/use-traffic-form";
import { BYTE_UNITS, formatBytes, type IUserUsage } from "@/services/users/traffic/traffic-types";
import { type IUser } from "@/services/users/user-types";
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
  const editor = useTrafficForm(user.id, usage, onClose);
  return (
    <form onSubmit={editor.onSubmit}>
      <Notice>
        {t("Использовано:")} {formatBytes(usage.upload + usage.download, t)}
        {t(". Когда лимит исчерпан, увеличьте его или сбросьте счётчики, чтобы вернуть доступ.")}
      </Notice>
      {!!usage.groupLimit && (
        <Notice>
          {t("Лимит группы:")} {formatBytes(usage.groupLimit, t)}.{" "}
          {t("Личный лимит может быть только строже.")}
        </Notice>
      )}
      <Field>
        {t("Единица измерения")}
        <Select value={editor.unit} onValueChange={editor.onUnit}>
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
          max={Number.MAX_SAFE_INTEGER / editor.unit}
          step="any"
          required
          value={editor.upload}
          onChange={(event) => editor.setUpload(event.target.value)}
        />
      </Field>
      <Field>
        {t("Получено клиентом")}
        <Input
          type="number"
          min={0}
          step="any"
          required
          value={editor.download}
          onChange={(event) => editor.setDownload(event.target.value)}
        />
      </Field>
      <Field>
        {t("Лимит трафика (0 без ограничений)")}
        <Input
          type="number"
          min={0}
          step="any"
          required
          value={editor.limit}
          onChange={(event) => editor.setLimit(event.target.value)}
        />
      </Field>
      <Actions>
        <Button type="button" variant="secondary" onClick={editor.onResetCounters}>
          {t("Сбросить счётчики")}
        </Button>
        <Button aria-label={t("Сохранить трафик")} variant="primary" disabled={editor.isPending}>
          {t("Сохранить")}
        </Button>
      </Actions>
      <Caption>{t("Трафик обновляется раз в 5 секунд.")}</Caption>
    </form>
  );
}
