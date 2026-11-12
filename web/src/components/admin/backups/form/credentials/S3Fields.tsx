import { useTranslation } from "react-i18next";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { FormPassword } from "@/components/ui/forms/FormPassword";
import { type IStorageCredentials } from "@/components/admin/backups/form/StorageCredentials";
export function S3Fields({ model: { form, isBusy } }: IStorageCredentials) {
  const { t } = useTranslation();
  return (
    <>
      <Field>
        {t("Адрес сервиса")}
        <Input
          {...form.register("endpoint")}
          type="url"
          required
          disabled={isBusy}
          placeholder="https://s3.example.com"
        />
      </Field>
      <Field>
        {t("Регион")}
        <Input {...form.register("region")} disabled={isBusy} />
      </Field>
      <Field>
        {t("Ключ доступа")}
        <Input {...form.register("accessKey")} required disabled={isBusy} autoComplete="off" />
      </Field>
      <FormPassword
        control={form.control}
        name="secretKey"
        label="Секретный ключ"
        canGenerate={false}
        minLength={1}
        maxLength={4096}
        required
        disabled={isBusy}
      />
    </>
  );
}
