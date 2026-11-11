import { Fieldset } from "@/components/ui/fields/Fieldset";
import { Caption } from "@/components/elements/Caption";
import { Field } from "@/components/ui/fields/Field";
import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { CoreOption } from "@/components/users/access/CoreOption";
import { useSaveUserAccess } from "@/hooks/users/access/hooks";
import { type IInstance } from "@/services/instances/types";
import { AccessMode, type IUserAccess } from "@/services/users/access/types";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
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
      {mode === AccessMode.Selected && ids.length === 0 && (
        <Notice variant="warning">
          {t("Ни один экземпляр не выбран. Подключения пользователя будут запрещены.")}
        </Notice>
      )}
      <Field>
        {t("Режим доступа к экземплярам")}
        <Select
          aria-label={t("Режим доступа к экземплярам")}
          value={mode}
          onValueChange={onMode}
          disabled={save.isPending}
        >
          <SelectOption value={AccessMode.All}>{t("Все экземпляры, включая новые")}</SelectOption>
          <SelectOption value={AccessMode.Selected}>{t("Только выбранные экземпляры")}</SelectOption>
        </Select>
      </Field>
      <Fieldset disabled={save.isPending}>
        <legend>{t("Экземпляры в подписке пользователя")}</legend>
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
      </Fieldset>
      <Caption>
        {t(
          "В подписке будут только разрешённые опубликованные экземпляры. При снятии доступа активное подключение к этому экземпляру отключается.",
        )}
      </Caption>
      {available.some((item) => item.authMode === "native") && (
        <Caption>
          {t("Экземпляры с собственной аутентификацией управляют доступом через свою конфигурацию.")}
        </Caption>
      )}
      <Button
        aria-label={t("Сохранить доступ")}
        className="full w-full"
        variant="primary"
        disabled={save.isPending}
      >
        {t(save.isPending ? "Сохраняем…" : "Сохранить")}
      </Button>
    </form>
  );
}
