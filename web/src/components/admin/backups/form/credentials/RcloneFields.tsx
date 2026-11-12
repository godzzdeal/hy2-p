import { useTranslation } from "react-i18next";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { FileDropzone } from "@/components/elements/upload";
import { type IStorageCredentials } from "@/components/admin/backups/form/StorageCredentials";
export function RcloneFields({ model: { form, onFile, isBusy } }: IStorageCredentials) {
  const { t } = useTranslation();
  return (
    <>
      <FileDropzone
        label={t("Конфигурация rclone")}
        hint={t("CONF, до 256 КБ")}
        accept=".conf"
        onFile={onFile}
        isBusy={isBusy}
      />
      <Field>
        {t("Путь rclone")}
        <Input {...form.register("destination")} required disabled={isBusy} placeholder="disk:HY2-P" />
      </Field>
    </>
  );
}
