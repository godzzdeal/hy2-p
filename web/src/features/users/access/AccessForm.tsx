import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectOption } from "@/shared/ui/select";
import { type IInstance } from "@/features/instances/model";
import { AccessMode, type IUserAccess, useSaveUserAccess } from "./model";
import { CoreOption } from "./CoreOption";
export function AccessForm({
  userId,
  initial,
  instances,
  onSaved,
}: {
  userId: string;
  initial: IUserAccess;
  instances: IInstance[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const available = instances.filter((item) => !item.removing);
  const eligible = available.filter((item) => item.authMode !== "native" && !item.error);
  const [mode, setMode] = useState(initial.mode);
  const [selected, setSelected] = useState(
    initial.mode === AccessMode.All ? eligible.map((item) => item.id) : initial.instances,
  );
  const save = useSaveUserAccess(userId);
  const ids = eligible.filter((item) => selected.includes(item.id)).map((item) => item.id);
  function onMode(next: string) {
    if (next !== AccessMode.All && next !== AccessMode.Selected) return;
    if (next === AccessMode.Selected && mode === AccessMode.All) setSelected(eligible.map((item) => item.id));
    setMode(next);
  }
  function onToggle(id: string, isChecked: boolean) {
    setSelected((current) => (isChecked ? [...current, id] : current.filter((item) => item !== id)));
  }
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate({ mode, instances: mode === AccessMode.All ? [] : ids }, { onSuccess: onSaved });
  }
  return (
    <form className="user-core-access" onSubmit={onSubmit}>
      <label>
        {t("Режим доступа к ядрам")}
        <Select
          aria-label={t("Режим доступа к ядрам")}
          value={mode}
          onValueChange={onMode}
          disabled={save.isPending}
        >
          <SelectOption value={AccessMode.All}>{t("Все ядра, включая новые")}</SelectOption>
          <SelectOption value={AccessMode.Selected}>{t("Только выбранные ядра")}</SelectOption>
        </Select>
      </label>
      <fieldset disabled={save.isPending}>
        <legend>{t("Ядра в подписке пользователя")}</legend>
        {available.map((instance) => (
          <CoreOption
            key={instance.id}
            instance={instance}
            isChecked={
              (mode === AccessMode.All || ids.includes(instance.id)) &&
              eligible.some((item) => item.id === instance.id)
            }
            isDisabled={mode === AccessMode.All || instance.authMode === "native" || !!instance.error}
            onToggle={onToggle}
          />
        ))}
      </fieldset>
      {mode === AccessMode.Selected && ids.length === 0 && (
        <p className="alert">{t("Ни одно ядро не выбрано. Подключения пользователя будут запрещены.")}</p>
      )}
      <p className="caption">
        {t(
          "В подписке будут только разрешённые опубликованные ядра. При снятии доступа активное подключение к этому ядру отключается.",
        )}
      </p>
      {available.some((item) => item.authMode === "native") && (
        <p className="caption">
          {t("Ядра с собственной аутентификацией управляют доступом через свою конфигурацию.")}
        </p>
      )}
      <button className="primary full" disabled={save.isPending}>
        {t(save.isPending ? "Сохраняем…" : "Сохранить доступ")}
      </button>
    </form>
  );
}
