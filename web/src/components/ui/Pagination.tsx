import { useTranslation } from "react-i18next";

interface IPagination {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onChange }: IPagination) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;
  return (
    <nav className="pagination" aria-label={t("Страницы списка")}>
      <button type="button" className="secondary" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        {t("Назад")}
      </button>
      <span role="status">
        {page + 1} / {pageCount}
      </span>
      <button
        type="button"
        className="secondary"
        disabled={page + 1 >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        {t("Далее")}
      </button>
    </nav>
  );
}
