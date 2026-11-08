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
    <label className="property-search">
      {t("Найти свойство")}
      <input
        aria-label={t("Найти свойство")}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="disableUDP, quic, auth…"
      />
      <small role="status">{t("Найдено свойств: {{count}}", { count })}</small>
    </label>
  );
}
