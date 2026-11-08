import { UserRow } from "@/components/users/list/row/UserRow";
import { type IUserActions } from "@/components/users/list/row/actions/UserActions";
import { useTraffic } from "@/hooks/users/traffic/use-traffic";
import { EMPTY_USAGE } from "@/services/users/traffic/traffic-types";
import { type IUser } from "@/services/users/user-types";
import { useTranslation } from "react-i18next";
interface IUserTable extends IUserActions {
  users: IUser[];
}
export function UserTable({ users, ...actions }: IUserTable) {
  const { t } = useTranslation();
  const traffic = useTraffic();
  return (
    <>
      <p className="traffic-note caption">
        {(traffic.error ? t(traffic.error.message) : t(traffic.data?.error ?? "")) ||
          (traffic.data?.updated
            ? t("Статистика: ") + new Date(traffic.data.updated).toLocaleTimeString()
            : t("Ожидание статистики ядра"))}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("Пользователь")}</th>
              <th>{t("Доступ")}</th>
              <th>{t("Подключение")}</th>
              <th>{t("Трафик")}</th>
              <th>{t("Действует до")}</th>
              <th>
                <span className="sr-only">{t("Действия")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                usage={traffic.data?.users[user.id] ?? EMPTY_USAGE}
                isTrafficAvailable={traffic.data?.available === true}
                {...actions}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
