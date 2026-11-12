import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button/Button";
import { type IStorage, STORAGE_PROVIDERS } from "@/services/admin/storage";

interface IStorageRow {
  account: IStorage;
  isBusy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSend: () => void;
  onCheck: () => void;
}
export function StorageRow({ account, isBusy, onEdit, onDelete, onSend, onCheck }: IStorageRow) {
  const { t } = useTranslation();
  const provider = STORAGE_PROVIDERS.find((item) => item.id === account.provider)?.name ?? account.provider;
  return (
    <li className="grid min-w-0 gap-4 border-2 border-line bg-input p-4">
      <div className="grid min-w-0 gap-2">
        <strong className="wrap-anywhere">{account.name}</strong>
        <p className="text-muted wrap-anywhere">
          {t(provider)} / {account.folder || "/"}
        </p>
        <code className="text-muted wrap-anywhere" title={t("ID хранилища")}>
          {account.id}
        </code>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" disabled={isBusy} onClick={onSend}>
          {t("Отправить бэкап")}
        </Button>
        <Button type="button" variant="secondary" disabled={isBusy} onClick={onCheck}>
          {t("Проверить")}
        </Button>
        {account.provider !== "rclone" && (
          <Button type="button" disabled={isBusy} onClick={onEdit}>
            {t("Изменить")}
          </Button>
        )}
        <Button type="button" variant="danger" disabled={isBusy} onClick={onDelete}>
          {t("Отключить")}
        </Button>
      </div>
    </li>
  );
}
