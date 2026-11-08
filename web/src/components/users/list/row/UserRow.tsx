import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { UserGroupBadge } from "@/components/groups/membership/UserGroupBadge";
import { UserActions, type IUserActions } from "@/components/users/list/row/actions/UserActions";
import { UserAvatar } from "@/components/users/list/row/UserAvatar";
import { ConnectionBadge } from "@/components/users/traffic/ConnectionBadge";
import { UsageCell } from "@/components/users/traffic/UsageCell";
import { trafficLimit, type IUserUsage } from "@/services/users/traffic/traffic-types";
import { isUserActive, type IUser } from "@/services/users/user-types";
import { cn } from "@/utils/cn";
import { FLAG_PREFIX } from "@/utils/flags/flag-options";
import { formatDate } from "@/utils/format-date";
import { useTranslation } from "react-i18next";
interface IUserRow extends IUserActions {
  user: IUser;
  usage: IUserUsage;
  isTrafficAvailable: boolean;
}
export function UserRow({ user, usage, isTrafficAvailable, onEdit, ...actions }: IUserRow) {
  const { t } = useTranslation();
  const limit = trafficLimit(usage);
  const isQuotaExceeded = limit > 0 && usage.upload + usage.download >= limit;
  const hasAccess = isUserActive(user) && !isQuotaExceeded;
  return (
    <tr>
      <td>
        <div className="user-identity">
          <UserAvatar name={user.name} />
          <div>
            <button className="user-cell" onClick={() => onEdit(user)}>
              <EmojiText value={user.name.replace(FLAG_PREFIX, "")} />
            </button>
            <div className="user-meta">
              <small>{user.id.slice(0, 8)}</small>
              <UserGroupBadge userId={user.id} />
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className={cn("badge", hasAccess ? "green" : "gray")}>
          {hasAccess
            ? t("Активен")
            : isQuotaExceeded
              ? t("Лимит исчерпан")
              : user.enabled
                ? t("Истёк")
                : t("Отключён")}
        </span>
      </td>
      <td>
        <ConnectionBadge online={usage.online} isAvailable={isTrafficAvailable} />
      </td>
      <td>
        <UsageCell usage={usage} />
      </td>
      <td>{formatDate(user.expires)}</td>
      <td className="user-actions-cell">
        <UserActions user={user} {...actions} />
      </td>
    </tr>
  );
}
