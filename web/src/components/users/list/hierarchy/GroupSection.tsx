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
      <tbody className={cn("user-group-section", groupClass)}>
        <tr>
          <td colSpan={6} className="user-group-title">
            <div className="user-group-heading">
              <button
                type="button"
                className="user-group-toggle"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(!isOpen)}
              >
                <ChevronRight width={24} height={24} aria-hidden />
                <span className="group-swatch" aria-hidden />
                <strong>{section.group?.name ?? t("Без группы")}</strong>
                <span className="user-count">{section.total}</span>
              </button>
              {section.group && (
                <button
                  type="button"
                  className="secondary"
                  aria-label={t("Участники группы {{name}}", { name: section.group.name })}
                  onClick={() => section.group && onMembers(section.group)}
                >
                  <Users width={24} height={24} aria-hidden />
                  {t("Участники")}
                </button>
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
