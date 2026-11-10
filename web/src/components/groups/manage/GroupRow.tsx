import { Button } from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/status/Badge";
import { Trash2, Users } from "@/components/elements/icons";
import { useDeleteGroup } from "@/hooks/groups/hooks";
import { type IGroup } from "@/services/groups/types";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
export function GroupRow({
  group,
  members,
  onEdit,
  onMembers,
}: {
  group: IGroup;
  members: number;
  onEdit: () => void;
  onMembers: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteGroup();
  return (
    <li className="group-row flex items-center justify-between gap-2 py-2">
      <Button
        type="button"
        className={cn(
          "group-name min-w-0 h-auto text-group-color text-left wrap-anywhere flex-1",
          "group-" + group.color,
        )}
        onClick={onEdit}
      >
        <span aria-hidden className="group-swatch w-2 h-2 bg-group-color shrink-0" />
        {group.name}
        <Badge className="user-count" count={members} variant="accent" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={t("Участники группы {{name}}", { name: group.name })}
        onClick={onMembers}
      >
        <Users width={24} height={24} aria-hidden />
      </Button>
      <Button
        type="button"
        variant="danger"
        size="icon"
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
      </Button>
    </li>
  );
}
