import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useConfiguration } from "@/features/configuration/model";
import { Modal, QueryState } from "@/shared/ui";
import { useInstanceCommands } from "../data";
import { instanceTemplate } from "./template";
import { useUiStore } from "@/app/state";
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
    <Modal title={t("Добавить ядро")} onClose={onClose}>
      <p className="muted">
        {t("Настройки будут скопированы из выбранного ядра. Новое ядро останется остановленным.")}
      </p>
      <QueryState isLoading={source.isPending} error={source.error} />
      <form onSubmit={onSubmit} className="instance-form">
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
        <label>
          {t("UDP-порт")}
          <input
            required
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(event) => setPort(event.target.value)}
          />
        </label>
        <p className="caption">
          {t(
            "Каждому ядру нужен свободный UDP-порт. После создания проверьте конфигурацию, запустите ядро и примените порт.",
          )}
        </p>
        <div className="form-actions">
          <button type="button" onClick={onClose}>
            {t("Отмена")}
          </button>
          <button className="primary" disabled={create.isPending || !source.data}>
            {t("Создать ядро")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
