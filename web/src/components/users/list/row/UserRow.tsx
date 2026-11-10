import { Button } from "@/components/ui/button/Button";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { UserGroupBadge } from "@/components/groups/membership/UserGroupBadge";
import { UserActions, type IUserActions } from "@/components/users/list/row/actions/UserActions";
import { UserAvatar } from "@/components/users/list/row/UserAvatar";
import { ConnectionBadge } from "@/components/users/traffic/ConnectionBadge";
import { UsageCell } from "@/components/users/traffic/UsageCell";
import { trafficLimit, type IUserUsage } from "@/services/users/traffic/traffic-types";
import { isUserActive, type IUser } from "@/services/users/user-types";
import { Badge } from "@/components/ui/status/Badge";
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
        <div className="user-identity flex items-center gap-3">
          <UserAvatar name={user.displayName ?? user.name} />
          <div>
            <Button
              className="user-cell h-auto min-h-6 gap-3 border-0 p-0 text-left font-bold"
              onClick={() => onEdit(user)}
            >
              <EmojiText value={(user.displayName ?? user.name).replace(FLAG_PREFIX, "")} />
            </Button>
            <div className="user-meta flex items-center gap-2">
              <small>{user.id.slice(0, 8)}</small>
              <UserGroupBadge userId={user.id} />
            </div>
          </div>
        </div>
      </td>
      <td>
        <Badge variant={hasAccess ? "success" : "neutral"}>
          {hasAccess
            ? t("Активен")
            : isQuotaExceeded
              ? t("Лимит исчерпан")
              : user.enabled
                ? t("Истёк")
                : t("Отключён")}
        </Badge>
      </td>
      <td>
        <ConnectionBadge online={usage.online} isAvailable={isTrafficAvailable} />
      </td>
      <td>
        <UsageCell usage={usage} />
      </td>
      <td>{formatDate(user.expires)}</td>
      <td className="user-actions-cell max-tablet:sticky max-tablet:right-0 max-tablet:bg-surface">
        <UserActions user={user} {...actions} />
      </td>
    </tr>
  );
}
