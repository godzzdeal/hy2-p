import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/ui";
import { type IInstance } from "../model";
import { useInstanceCommands } from "../data";
export function RenameInstanceDialog({ instance, onClose }: { instance: IInstance; onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(instance.name);
  const { rename } = useInstanceCommands();
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    rename.mutate({ id: instance.id, name }, { onSuccess: onClose });
  }
  return (
    <Modal title={t("Переименовать ядро")} onClose={onClose}>
      <form className="instance-form" onSubmit={onSubmit}>
        <label>
          {t("Название ядра")}
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
