import { type ITransferRow } from "@/services/admin/transfer/api";
import { useTranslation } from "react-i18next";
const KINDS = { core: "Экземпляр", group: "Группа", user: "Пользователь" } as const;
const ACTIONS = {
  add: "Будет добавлено",
  added: "Добавлено",
  skip: "Пропущено",
  conflict: "Совпадение",
  failed: "Ошибка",
} as const;
export function TransferRow({ row }: { row: ITransferRow }) {
  const { t } = useTranslation();
  return (
    <li className="transfer-row grid grid-cols-2 gap-4 p-3 border border-line max-tablet:grid-cols-1">
      <div>
        <strong>{row.name}</strong>
        <small>{t(KINDS[row.kind])}</small>
      </div>
      <div>
        <strong>{t(ACTIONS[row.action])}</strong>
        {row.reason && <small>{t(row.reason)}</small>}
      </div>
    </li>
  );
}
