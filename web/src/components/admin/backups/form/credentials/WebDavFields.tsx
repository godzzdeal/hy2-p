import { useTranslation } from "react-i18next";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { FormPassword } from "@/components/ui/forms/FormPassword";
import { type IStorageCredentials } from "@/components/admin/backups/form/StorageCredentials";
export function WebDavFields({ model: { form, isBusy } }: IStorageCredentials) {
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
          placeholder="https://cloud.example.com/dav/"
        />
      </Field>
      <Field>
        {t("Логин")}
        <Input {...form.register("username")} required disabled={isBusy} autoComplete="off" />
      </Field>
      <FormPassword
        control={form.control}
        name="password"
        label="Пароль"
        canGenerate={false}
        minLength={1}
        maxLength={4096}
        required
        disabled={isBusy}
      />
    </>
  );
}
