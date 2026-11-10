import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/overlays/Modal";
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
      <form className="instance-form grid gap-4" onSubmit={onSubmit}>
        <Field>
          {t("Название экземпляра")}
          <Input
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </Field>
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            {t("Отмена")}
          </Button>
          <Button variant="primary" disabled={rename.isPending}>
            {t("Сохранить")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
