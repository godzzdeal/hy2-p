import { Modal } from "@/components/ui/modal/Modal";
import { useInstanceCommands } from "@/hooks/instances/use-commands";
import { type IInstance } from "@/services/instances/types";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
export function RenameInstanceDialog({ instance, onClose }: { instance: IInstance; onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(instance.name);
  const { rename } = useInstanceCommands();
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    rename.mutate({ id: instance.id, name }, { onSuccess: onClose });
  }
  return (
    <Modal title={t("Переименовать экземпляр")} onClose={onClose}>
      <form className="instance-form" onSubmit={onSubmit}>
        <label>
          {t("Название экземпляра")}
          <input
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </label>
        <div className="form-actions">
          <button type="button" onClick={onClose}>
            {t("Отмена")}
          </button>
          <button className="primary" disabled={rename.isPending}>
            {t("Сохранить")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
