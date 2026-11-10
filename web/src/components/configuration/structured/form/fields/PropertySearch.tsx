import { Field } from "@/components/ui/fields/Field";
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
    <Field className="property-search m-0 flex-1 max-w-140">
      {t("Найти свойство")}
      <Input
        aria-label={t("Найти свойство")}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="disableUDP, quic, auth…"
      />
      <small role="status">{t("Найдено свойств: {{count}}", { count })}</small>
    </Field>
  );
}
