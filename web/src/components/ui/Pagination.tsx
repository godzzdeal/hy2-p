import { Button } from "@/components/ui/button/Button";
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
    <nav
      className="pagination flex flex-wrap justify-between items-center gap-3 p-4"
      aria-label={t("Страницы списка")}
    >
      <Button type="button" variant="secondary" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        {t("Назад")}
      </Button>
      <span role="status">
        {page + 1} / {pageCount}
      </span>
      <Button
        type="button"
        variant="secondary"
        disabled={page + 1 >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        {t("Далее")}
      </Button>
    </nav>
  );
}
