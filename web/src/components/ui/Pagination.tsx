import { Button } from "@/components/ui/button/Button";
import { cn } from "@/utils/cn";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

interface IPagination extends Omit<ComponentProps<"nav">, "onChange"> {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onChange, className, ...props }: IPagination) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;
  return (
    <nav
      {...props}
      className={cn("pagination flex flex-wrap justify-between items-center gap-3 p-4", className)}
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
