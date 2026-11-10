import { Button } from "@/components/ui/button/Button";
import { ChevronRight, Users } from "@/components/elements/icons";
import { UserRow } from "@/components/users/list/row/UserRow";
import { type IUserActions } from "@/components/users/list/row/actions/UserActions";
import { type IUserGroupSection } from "@/services/groups/membership";
import { type IGroup } from "@/services/groups/types";
import { EMPTY_USAGE, type ITraffic } from "@/services/users/traffic/traffic-types";
import { cn } from "@/utils/cn";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

interface IGroupSection extends IUserActions {
  section: IUserGroupSection;
  onMembers: (group: IGroup) => void;
  traffic?: ITraffic;
}
export function GroupSection({ section, onMembers, traffic, ...actions }: IGroupSection) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(true);
  const id = useId();
  const groupClass = "group-" + (section.group?.color ?? "gray");
  return (
    <>
      <tbody className={cn("user-group-section border-t border-line", groupClass)}>
        <tr>
          <td colSpan={6} className="user-group-title p-0">
            <div className="user-group-heading flex items-center gap-2 py-2 px-3 min-w-0 sticky left-0 max-w-full bg-surface max-tablet:flex-wrap">
              <Button
                type="button"
                className="user-group-toggle flex-1 justify-start text-left min-w-0 h-auto px-0 gap-2"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(!isOpen)}
              >
                <ChevronRight width={24} height={24} aria-hidden />
                <span className="group-swatch w-2 h-2 bg-group-color shrink-0" aria-hidden />
                <strong>{section.group?.name ?? t("Без группы")}</strong>
                <span className="user-count inline-flex items-center justify-center flex-none border border-line bg-surface-soft text-accent">
                  {section.total}
                </span>
              </Button>
              {section.group && (
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={t("Участники группы {{name}}", { name: section.group.name })}
                  onClick={() => section.group && onMembers(section.group)}
                >
                  <Users width={24} height={24} aria-hidden />
                  {t("Участники")}
                </Button>
              )}
            </div>
          </td>
        </tr>
      </tbody>
      <tbody id={id} hidden={!isOpen} className={cn("group-users", groupClass)}>
        {section.users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            usage={traffic?.users[user.id] ?? EMPTY_USAGE}
            isTrafficAvailable={traffic?.available === true}
            {...actions}
          />
        ))}
      </tbody>
    </>
  );
}
