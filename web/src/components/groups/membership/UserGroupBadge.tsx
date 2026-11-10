import { Button } from "@/components/ui/button/Button";
import { UserGroupDialog } from "@/components/groups/membership/UserGroupDialog";
import { useGroups } from "@/hooks/groups/hooks";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function UserGroupBadge({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const query = useGroups();
  const [isOpen, setOpen] = useState(false);
  const group = query.data?.groups?.find((item) => item.id === query.data?.memberships?.[userId]);
  return (
    <>
      <Button
        type="button"
        className={cn(
          "group-badge max-tablet:min-h-control text-group-color min-h-6 h-auto py-0 px-1",
          "group-" + (group?.color ?? "gray"),
        )}
        disabled={query.isPending || !!query.error}
        aria-label={t("Изменить группу пользователя {{id}}", { id: userId })}
        onClick={() => setOpen(true)}
      >
        <span className="group-swatch w-2 h-2 bg-group-color shrink-0" aria-hidden />
        {group?.name ?? t("Без группы")}
      </Button>
      {isOpen && <UserGroupDialog userId={userId} onClose={() => setOpen(false)} />}
    </>
  );
}
