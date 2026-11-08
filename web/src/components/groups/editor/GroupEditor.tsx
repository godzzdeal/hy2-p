import { GroupColorPicker } from "@/components/groups/editor/GroupColorPicker";
import { GroupPolicyFields } from "@/components/groups/editor/GroupPolicyFields";
import { useSaveGroup } from "@/hooks/groups/hooks";
import { type IGroup, type IGroupInput } from "@/services/groups/types";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
export function GroupEditor({ group, onClose }: { group?: IGroup; onClose: () => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState<IGroupInput>(
    group ?? {
      name: "",
      color: "cyan",
      access: { mode: "all", instances: [] },
      trafficLimit: 0,
      deviceLimit: 0,
    },
  );
  const save = useSaveGroup();
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate({ id: group?.id, body: value }, { onSuccess: onClose });
  }
  return (
    <form className="group-editor" onSubmit={onSubmit}>
      <fieldset disabled={save.isPending}>
        <legend>{t(group ? "Редактировать группу" : "Новая группа")}</legend>
        <label>
          {t("Название группы")}
          <input
            required
            maxLength={100}
            value={value.name}
            onChange={(event) => setValue({ ...value, name: event.target.value })}
          />
        </label>
        <GroupColorPicker value={value.color} onChange={(color) => setValue({ ...value, color })} />
        <GroupPolicyFields value={value} onChange={setValue} />
      </fieldset>
      <div className="row-actions">
        <button type="button" className="secondary" onClick={onClose} disabled={save.isPending}>
          {t("Назад")}
        </button>
        <button className="primary" disabled={save.isPending}>
          {t(save.isPending ? "Сохраняем…" : "Сохранить группу")}
        </button>
      </div>
    </form>
  );
}
