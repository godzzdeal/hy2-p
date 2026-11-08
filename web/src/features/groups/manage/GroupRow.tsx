import { useTranslation } from "react-i18next";
import { Trash2 } from "@/shared/icons";
import { cn } from "@/shared/lib";
import { useDeleteGroup, type IGroup } from "../model";
export function GroupRow({ group, members, onEdit }: { group: IGroup; members: number; onEdit: () => void }) {
  const { t } = useTranslation();
  const remove = useDeleteGroup();
  return (
    <li className="group-row">
      <button type="button" className={cn("group-name", "group-" + group.color)} onClick={onEdit}>
        <span aria-hidden className="group-swatch" />
        {group.name}
        <span className="user-count">{members}</span>
      </button>
      <button
        type="button"
        className="icon-btn danger"
        aria-label={t("Удалить группу {{name}}", { name: group.name })}
        disabled={remove.isPending}
        onClick={() => {
          if (
            window.confirm(
              t("Удалить группу? Пользователи сохранятся, ограничения группы перестанут действовать."),
            )
          )
            remove.mutate(group.id);
        }}
      >
        <Trash2 width={24} height={24} aria-hidden />
      </button>
    </li>
  );
}
