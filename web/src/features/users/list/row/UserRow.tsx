import { UserAvatar } from "./UserAvatar";
import { FLAG_PREFIX } from "@/shared/flags";
import { useTranslation } from "react-i18next";
import { Gauge, QrCode, Trash2 } from "lucide-react";
import { type IUser } from "@/features/users/model";
import { isUserActive } from "@/features/users/model";
import { type IUserUsage } from "@/features/users/traffic/model";
import { ConnectionBadge, UsageCell } from "@/features/users/traffic";
import { cn, formatDate } from "@/shared/lib";
export interface IUserActions {
  onEdit: (user: IUser) => void;
  onShare: (user: IUser) => void;
  onDelete: (user: IUser) => void;
  onTraffic: (user: IUser) => void;
}
interface IUserRow extends IUserActions {
  user: IUser;
  usage: IUserUsage;
  isTrafficAvailable: boolean;
}
export function UserRow({ user, usage, isTrafficAvailable, onEdit, onShare, onDelete, onTraffic }: IUserRow) {
  const { t } = useTranslation();
  const isQuotaExceeded = usage.limit > 0 && usage.upload + usage.download >= usage.limit;
  const hasAccess = isUserActive(user) && !isQuotaExceeded;
  return (
    <tr>
      <td>
        <button className="user-cell" onClick={() => onEdit(user)}>
          <UserAvatar name={user.name} />
          <span>
            <strong>{user.name.replace(FLAG_PREFIX, "")}</strong>
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
      <td>
        <div className="row-actions">
          <button
            className="icon-btn"
            aria-label={t("Подключение ") + user.name}
            onClick={() => onShare(user)}
          >
            <QrCode size={20} aria-hidden />
          </button>
          <button className="icon-btn" aria-label={t("Трафик ") + user.name} onClick={() => onTraffic(user)}>
            <Gauge size={20} aria-hidden />
          </button>
          <button
            className="icon-btn danger"
            aria-label={t("Удалить ") + user.name}
            onClick={() => onDelete(user)}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  );
}
