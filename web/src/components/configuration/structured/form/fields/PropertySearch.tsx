import { Input } from "@/components/ui/fields/controls/Input";
import { useTranslation } from "react-i18next";
export function PropertySearch({
  value,
  onChange,
  count,
}: {
  value: string;
  onChange: (value: string) => void;
  count: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="property-search flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <Input
        className="min-w-40 max-w-140 flex-1"
        aria-label={t("Найти свойство")}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("Название свойства")}
      />
      <small className="whitespace-nowrap text-muted" role="status">
        {t("Найдено свойств: {{count}}", { count })}
      </small>
    </div>
  );
}
