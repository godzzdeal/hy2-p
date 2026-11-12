import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { QueryState } from "@/components/ui/loading";
import { StorageRow } from "@/components/admin/backups/storage/StorageRow";
import { StorageDisconnect } from "@/components/admin/backups/storage/StorageDisconnect";
import { StorageForm } from "@/components/admin/backups/form/StorageForm";
import { useStorageList } from "@/hooks/admin/storage";

export function StorageList() {
  const { t } = useTranslation();
  const model = useStorageList();
  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3>{t("Облачные хранилища")}</h3>
        <Button
          type="button"
          variant="primary"
          disabled={model.isBusy || !model.settings.data}
          onClick={() => model.setEditing(null)}
        >
          {t("Подключить")}
        </Button>
      </div>
      <QueryState isLoading={model.settings.isPending} error={model.settings.error} />
      {model.settings.data?.accounts.length === 0 && (
        <Notice>{t("Подключите хранилище для отправки бэкапов.")}</Notice>
      )}
      <ul className="grid gap-4">
        {model.settings.data?.accounts.map((account) => (
          <StorageRow
            key={account.id}
            account={account}
            isBusy={model.isBusy}
            onEdit={() => model.setEditing(account)}
            onDelete={() => model.setRemoving(account)}
            onSend={() => model.operation.mutate({ action: "backup-cloud", storageId: account.id })}
            onCheck={() => model.operation.mutate({ action: "check-cloud", storageId: account.id })}
          />
        ))}
      </ul>
      {model.editing !== undefined && (
        <StorageForm
          account={model.editing ?? undefined}
          onClose={() => model.setEditing(undefined)}
          onSave={model.onSave}
        />
      )}
      {model.removing && (
        <StorageDisconnect
          account={model.removing}
          isBusy={model.change.isPending}
          onClose={() => model.setRemoving(null)}
          onConfirm={model.onDisconnect}
        />
      )}
    </div>
  );
}
