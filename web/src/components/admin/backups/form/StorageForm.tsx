import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/overlays/Modal";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Select, SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button/Button";
import { Actions } from "@/components/ui/Actions";
import { Notice } from "@/components/ui/feedback";
import { QueryState } from "@/components/ui/loading";
import { StorageCredentials } from "@/components/admin/backups/form/StorageCredentials";
import { ProviderSetup } from "@/components/admin/backups/form/ProviderSetup";
import { useStorageForm } from "@/hooks/admin/storage";
import {
  STORAGE_PROVIDERS,
  type IStorageFields,
  type IStorage,
  type TStorageProvider,
} from "@/services/admin/storage";

interface IStorageForm {
  account?: IStorage;
  onClose: () => void;
  onSave: (values: IStorageFields) => Promise<void>;
}
export function StorageForm({ account, onClose, onSave }: IStorageForm) {
  const { t } = useTranslation();
  const model = useStorageForm(onSave, account, onClose);
  const { form, isBusy } = model;
  return (
    <Modal title="Хранилище" onClose={onClose} isDismissible={!isBusy}>
      <form className="grid min-w-0 gap-4" onSubmit={model.onSubmit}>
        {!account && (
          <Field>
            {t("Сервис")}
            <Select
              value={model.provider}
              disabled={isBusy}
              onValueChange={(value) => form.setValue("provider", value as TStorageProvider)}
            >
              {STORAGE_PROVIDERS.map((provider) => (
                <SelectOption key={provider.id} value={provider.id}>
                  {t(provider.name)}
                </SelectOption>
              ))}
            </Select>
          </Field>
        )}
        {model.isBrowser && <QueryState isLoading={model.providers.isPending} error={null} />}
        {model.isBrowser && model.providers.error && (
          <Notice variant="warning">{t(model.providers.error.message)}</Notice>
        )}
        {model.isBrowser && model.providers.data && (
          <ProviderSetup key={model.provider} provider={model.provider} application={model.application} />
        )}
        <Field>
          {t("Название")}
          <Input {...form.register("name")} required maxLength={80} disabled={isBusy} autoComplete="off" />
        </Field>
        {model.provider !== "rclone" && (
          <Field>
            {t(model.provider === "s3" ? "Бакет и папка" : "Папка в облаке")}
            <Input {...form.register("folder")} maxLength={512} disabled={isBusy} placeholder="HY2-P" />
          </Field>
        )}
        {!account && <StorageCredentials model={model} />}
        {model.isWaiting && (
          <Notice>
            {t("Завершите вход в открывшемся окне. Если вы закрыли его, нажмите «Войти в аккаунт» ещё раз.")}
          </Notice>
        )}
        <Actions>
          <Button type="button" onClick={onClose} disabled={isBusy}>
            {t("Отмена")}
          </Button>
          <Button type="submit" variant="primary" disabled={isBusy || !model.canConnect}>
            {t(isBusy ? "Подключаем…" : model.isBrowser ? "Войти в аккаунт" : "Сохранить")}
          </Button>
        </Actions>
      </form>
    </Modal>
  );
}
