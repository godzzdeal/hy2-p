import { useTranslation } from "react-i18next";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { FormPassword } from "@/components/ui/forms/FormPassword";
import { CopyButton } from "@/components/elements/copy";
import { Button } from "@/components/ui/button/Button";
import { ChevronRight } from "pixelarticons/react/ChevronRight.js";
import { ProviderHelp } from "@/components/admin/backups/form/help";
import { useProviderSetup } from "@/hooks/admin/storage/use-storage-form";
import { type IStorageProvider, type TStorageProvider } from "@/services/admin/storage";
interface IProviderSetup {
  provider: TStorageProvider;
  application?: IStorageProvider;
}
export function ProviderSetup({ provider, application }: IProviderSetup) {
  const { t } = useTranslation();
  const model = useProviderSetup(provider, application);
  return (
    <details className="min-w-0 border-2 border-line bg-input p-4" open={!application?.hasSecret}>
      <summary className="flex cursor-pointer items-center gap-3">
        <ChevronRight width={24} height={24} aria-hidden />
        {t("Настройки входа")}
      </summary>
      <div className="mt-4 grid min-w-0 gap-4">
        <ProviderHelp provider={provider} />
        <Field>
          {t("Адрес возврата")}
          <div className="flex min-w-0 items-center gap-2">
            <Input readOnly value={model.callbackURL} />
            <CopyButton value={model.callbackURL} label="Скопировать адрес возврата" isIconOnly />
          </div>
        </Field>
        <Field>
          Client ID
          <Input
            {...model.form.register("clientId")}
            maxLength={512}
            disabled={model.isSaving}
            autoComplete="off"
          />
        </Field>
        <FormPassword
          control={model.form.control}
          name="clientSecret"
          label="Client Secret"
          minLength={1}
          maxLength={8192}
          canGenerate={false}
          disabled={model.isSaving}
          placeholder={application?.hasSecret ? "Сохранён. Оставьте пустым, чтобы не менять" : undefined}
        />
        <Button type="button" variant="secondary" disabled={model.isSaving} onClick={model.onSave}>
          {t("Сохранить")}
        </Button>
      </div>
    </details>
  );
}
