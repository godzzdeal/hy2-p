import { UserAvatar } from "./UserAvatar";
import { EmojiText } from "@/shared/emoji";
import { FLAG_PREFIX } from "@/shared/flags";
import { useTranslation } from "react-i18next";
import { UserActions, type IUserActions } from "./actions";
import { type IUser } from "@/features/users/model";
import { isUserActive } from "@/features/users/model";
import { type IUserUsage } from "@/features/users/traffic/model";
import { ConnectionBadge, UsageCell } from "@/features/users/traffic";
import { cn, formatDate } from "@/shared/lib";
interface IUserRow extends IUserActions {
  user: IUser;
  usage: IUserUsage;
  isTrafficAvailable: boolean;
}
export function UserRow({ user, usage, isTrafficAvailable, onEdit, ...actions }: IUserRow) {
  const { t } = useTranslation();
  const isQuotaExceeded = usage.limit > 0 && usage.upload + usage.download >= usage.limit;
  const hasAccess = isUserActive(user) && !isQuotaExceeded;
  return (
    <tr>
      <td>
        <button className="user-cell" onClick={() => onEdit(user)}>
          <UserAvatar name={user.name} />
          <span>
            <strong>
              <EmojiText value={user.name.replace(FLAG_PREFIX, "")} />
            </strong>
            <small>{user.id.slice(0, 8)}</small>
          </span>
        </button>
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
