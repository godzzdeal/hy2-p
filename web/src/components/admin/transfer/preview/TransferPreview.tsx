import { TransferRow } from "@/components/admin/transfer/preview/TransferRow";
import { Pagination } from "@/components/ui/Pagination";
import { NETWORK } from "@/config/network";
import { type ITransferPreview } from "@/services/admin/transfer/api";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function TransferPreview({ value }: { value: ITransferPreview }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(value.rows.length / NETWORK.pageSize));
  const current = Math.min(page, pages - 1);
  const added = value.rows.filter((row) => row.action === "add" || row.action === "added").length;
  return (
    <div className="transfer-preview">
      <p>
        {t("Новых записей")}: {added}. {t("Всего записей")}: {value.rows.length}.
      </p>
      <ul>
        {value.rows.slice(current * NETWORK.pageSize, (current + 1) * NETWORK.pageSize).map((row) => (
          <TransferRow key={row.kind + row.id} row={row} />
        ))}
      </ul>
      <Pagination page={current} pageCount={pages} onChange={setPage} />
    </div>
  );
}
