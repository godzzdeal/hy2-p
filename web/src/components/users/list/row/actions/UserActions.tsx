import { Gauge, Monitor, QrCode, Server, Trash2 } from "@/components/elements/icons";
import { UserActionButton } from "@/components/users/list/row/actions/UserActionButton";
import { UserActionMenu } from "@/components/users/list/row/actions/UserActionMenu";
import { type IUser } from "@/services/users/user-types";
import { useTranslation } from "react-i18next";
export interface IUserActions {
  onEdit: (user: IUser) => void;
  onShare: (user: IUser) => void;
  onDelete: (user: IUser) => void;
  onTraffic: (user: IUser) => void;
  onAccess: (user: IUser) => void;
  onDevices: (user: IUser) => void;
}
export interface IUserAction {
  label: string;
  accessibleName: string;
  icon: typeof Monitor;
  isDanger?: boolean;
  onSelect: () => void;
}
interface IUserActionList extends Omit<IUserActions, "onEdit"> {
  user: IUser;
}
export function UserActions({ user, onShare, onDelete, onTraffic, onAccess, onDevices }: IUserActionList) {
  const { t } = useTranslation();
  const actions: IUserAction[] = [
    {
      label: t("Устройства"),
      accessibleName: t("Устройства ") + user.name,
      icon: Monitor,
      onSelect: () => onDevices(user),
    },
    {
      label: t("Доступные ядра"),
      accessibleName: t("Доступные ядра ") + user.name,
      icon: Server,
      onSelect: () => onAccess(user),
    },
    {
      label: t("Подключение"),
      accessibleName: t("Подключение ") + user.name,
      icon: QrCode,
      onSelect: () => onShare(user),
    },
    {
      label: t("Трафик"),
      accessibleName: t("Трафик ") + user.name,
      icon: Gauge,
      onSelect: () => onTraffic(user),
    },
    {
      label: t("Удалить"),
      accessibleName: t("Удалить ") + user.name,
      icon: Trash2,
      isDanger: true,
      onSelect: () => onDelete(user),
    },
  ];
  return (
    <div className="user-actions">
      <div className="row-actions user-row-actions">
        {actions.map((action) => (
          <UserActionButton key={action.accessibleName} action={action} isCompact />
        ))}
      </div>
      <UserActionMenu actions={actions} name={user.name} />
    </div>
  );
}
