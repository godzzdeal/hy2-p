import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { type UseMutationResult } from "@tanstack/react-query";
import { type IBackupInput, type IBackupSettings } from "@/services/admin/admin-types";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { FileDropzone } from "@/components/elements/upload";
import { CommandBlock } from "@/components/elements/copy";
import { usePanelOperation } from "@/hooks/panel/maintenance";
import { usePanelOperationStore } from "@/store/core/panel-operation-store";
import { BACKUP_LIMITS } from "@/config/network";
interface IBackupForm {
  initial: IBackupSettings;
  save: UseMutationResult<IBackupSettings, unknown, IBackupInput>;
}
export function BackupForm({ initial, save }: IBackupForm) {
  const { t } = useTranslation();
  const [destination, setDestination] = useState(initial.destination);
  const [configText, setConfigText] = useState("");
  const operation = usePanelOperation();
  const isActive = usePanelOperationStore((state) => !!state.active);
  const isBusy = isActive || save.isPending || operation.isPending;
  const current = save.data ?? initial;
  async function onFile(file: File) {
    if (file.size > BACKUP_LIMITS.configBytes) throw new Error(t("Максимальный размер: 256 КБ"));
    setConfigText(await file.text());
  }
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate({ destination, configText }, { onSuccess: () => setConfigText("") });
  }
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <p>
        {t(
          "Подключите Яндекс Диск, Google Drive или другое хранилище через rclone. Создайте конфигурацию на своём компьютере и загрузите её сюда.",
        )}
      </p>
      <CommandBlock command="rclone config" />
      <FileDropzone
        label={t("Конфигурация rclone")}
        hint={t("CONF, до 256 КБ")}
        accept=".conf"
        onFile={onFile}
        isBusy={isBusy}
      />
      <Field>
        {t("Папка в облаке")}
        <Input
          placeholder="disk:HY2-P"
          value={destination}
          required
          disabled={isBusy}
          onChange={(event) => setDestination(event.target.value)}
        />
      </Field>
      <Actions>
        <Button variant="secondary" disabled={isBusy || (!configText && destination === current.destination)}>
          {t("Сохранить")}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={isBusy || !current.hasConfig || !!configText || destination !== current.destination}
          onClick={() => operation.mutate({ action: "backup-cloud" })}
        >
          {t("Отправить в облако")}
        </Button>
      </Actions>
    </form>
  );
}
