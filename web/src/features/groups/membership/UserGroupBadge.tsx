import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib";
import { useGroups } from "../model";
import { UserGroupDialog } from "./UserGroupDialog";
export function UserGroupBadge({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const query = useGroups();
  const [isOpen, setOpen] = useState(false);
  const group = query.data?.groups?.find((item) => item.id === query.data?.memberships?.[userId]);
  return (
    <>
      <button
        type="button"
        className={cn("group-badge", "group-" + (group?.color ?? "gray"))}
        disabled={query.isPending || !!query.error}
        aria-label={t("Изменить группу пользователя {{id}}", { id: userId })}
        onClick={() => setOpen(true)}
      >
        <span className="group-swatch" aria-hidden />
        {group?.name ?? t("Без группы")}
      </button>
      {isOpen && <UserGroupDialog userId={userId} onClose={() => setOpen(false)} />}
    </>
  );
}
