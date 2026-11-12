import { Caption } from "@/components/elements/Caption";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/overlays/Modal";
import { QueryState } from "@/components/ui/loading";
import { useConfiguration } from "@/hooks/configuration/use-configuration";
import { useInstanceCommands } from "@/hooks/instances/use-commands";
import { useUiStore } from "@/store/ui-store";
import { instanceTemplate } from "@/utils/instances/dialogs/template";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
export function CreateInstanceDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useTranslation();
  const source = useConfiguration();
  const [name, setName] = useState("");
  const [port, setPort] = useState("");
  const { create } = useInstanceCommands();
  const showError = useUiStore((state) => state.showError);
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!source.data) return;
    try {
      create.mutate(
        { name, settings: instanceTemplate(source.data, port) },
        { onSuccess: (result) => onCreated(result.id) },
      );
    } catch (error) {
      showError(error);
    }
  }
  return (
    <Modal title={t("Добавить экземпляр")} onClose={onClose}>
      <p className="muted">
        {t("Настройки скопируются из выбранного экземпляра. Новый экземпляр останется остановленным.")}
      </p>
      <QueryState isLoading={source.isPending} error={source.error} />
      <form onSubmit={onSubmit} className="instance-form grid gap-4">
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
        <Field>
          {t("UDP-порт")}
          <Input
            required
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(event) => setPort(event.target.value)}
          />
        </Field>
        <Caption>
          {t(
            "Выберите свободный UDP-порт, сохраните конфигурацию и примените порт. Затем запустите экземпляр.",
          )}
        </Caption>
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            {t("Отмена")}
          </Button>
          <Button
            aria-label={t("Создать экземпляр")}
            variant="primary"
            disabled={create.isPending || !source.data}
          >
            {t("Создать")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
