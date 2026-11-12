import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/overlays/Modal";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import type { IStorage } from "@/services/admin/storage";

interface IStorageDisconnect {
  account: IStorage;
  isBusy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
export function StorageDisconnect({ account, isBusy, onClose, onConfirm }: IStorageDisconnect) {
  const { t } = useTranslation();
  return (
    <Modal title="Отключить хранилище?" onClose={onClose} isDismissible={!isBusy}>
      <p className="mb-4 wrap-anywhere">
        {account.name}. {t("Данные доступа будут удалены с сервера. Файлы в облаке сохранятся.")}
      </p>
      <Actions>
        <Button type="button" onClick={onClose} disabled={isBusy}>
          {t("Отмена")}
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={isBusy}>
          {t("Отключить")}
        </Button>
      </Actions>
    </Modal>
  );
}
