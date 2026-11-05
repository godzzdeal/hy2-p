import { useId } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { cn } from "@/shared/lib";
import { type IConfigField } from "@/features/configuration/structured/model";
import { FieldControl } from "./FieldControl";
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
  const id = useId();
  const isSet = value !== undefined && value !== null;
  return (
    <div className={cn("config-field", { "col-span-full": field.kind === "json" || field.kind === "pairs" })}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} id={id + "-label"}>
          {t(field.label)}
        </label>
        <button
          type="button"
          className="field-reset"
          disabled={!isSet}
          aria-label={t("Сбросить {{field}}", { field: t(field.label) })}
          title={t("Вернуть значение по умолчанию")}
          onClick={() => onChange(undefined)}
        >
          <RotateCcw size={16} aria-hidden />
        </button>
      </div>
      <FieldControl id={id} field={field} value={value} onChange={onChange} />
      {field.hint && <small className="field-hint">{t(field.hint)}</small>}
      <small className="field-path">
        <code>{field.path}</code>
      </small>
    </div>
  );
}
