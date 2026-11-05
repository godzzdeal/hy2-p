import { useTranslation } from "react-i18next";
import type { IConfigField } from "./model";
import { formatField, parseField } from "./model";
import { JsonField, PairEditor } from "./fields";
import { PasswordField } from "@/shared/security";
export function ConfigField({
  field,
  value,
  onChange,
}: {
  field: IConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { t } = useTranslation();
  const formatted = formatField(value, field.kind);
  if (field.kind === "password")
    return <PasswordField label={t(field.label)} value={formatted} onChange={onChange} />;
  if (field.kind === "toggle")
    return (
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        {t(field.label)}
      </label>
    );
  return (
    <label className={field.kind === "json" || field.kind === "pairs" ? "full-field" : undefined}>
      {t(field.label)}
      {field.kind === "select" ? (
        <select value={formatted} onChange={(event) => onChange(event.target.value)}>
          <option value="">{t("По умолчанию / выключено")}</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.kind === "pairs" ? (
        <PairEditor value={value} onChange={onChange} hasGenerator={field.path === "auth.userpass"} />
      ) : field.kind === "json" || field.kind === "multiline" ? (
        <JsonField value={formatted} onChange={onChange} multiline={field.kind === "multiline"} />
      ) : field.kind === "lines" ? (
        <textarea
          value={formatted}
          onChange={(event) => onChange(parseField(event.target.value, field.kind))}
        />
      ) : (
        <input
          type={field.kind === "number" ? "number" : "text"}
          value={formatted}
          onChange={(event) => onChange(parseField(event.target.value, field.kind))}
        />
      )}
      <small>
        <code>{field.path}</code>
        {field.hint && <> · {t(field.hint)}</>}
      </small>
    </label>
  );
}
