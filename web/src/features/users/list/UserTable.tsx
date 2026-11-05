import { useTranslation } from "react-i18next";
import { type IUser } from "@/features/users/model";
import { UserRow } from "./UserRow";
import { type IUserActions } from "./UserRow";
import { EMPTY_USAGE, useTraffic } from "@/features/users/traffic/model";
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
