import { FIELD_COPY } from "../copy";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "@/shared/icons";
import { cn } from "@/shared/lib";
import { type IConfigField } from "@/features/configuration/structured/model";
import { FieldControl } from "./FieldControl";
export function ConfigField({
  field,
  value,
  onChange,
  showPath = false,
}: {
  field: IConfigField;
  showPath?: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const displayField = { ...field, ...FIELD_COPY[field.path] };
  const isSet = value !== undefined && value !== null;
  return (
    <div className={cn("config-field", { "col-span-full": field.kind === "json" || field.kind === "pairs" })}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} id={id + "-label"}>
          {t(displayField.label)}
        </label>
        <button
          type="button"
          className="field-reset"
          disabled={!isSet}
          aria-label={t("Сбросить {{field}}", { field: t(displayField.label) })}
          title={t("Вернуть значение по умолчанию")}
          onClick={() => onChange(undefined)}
        >
          <RotateCcw width={24} height={24} aria-hidden />
        </button>
      </div>
      <FieldControl id={id} field={displayField} value={value} onChange={onChange} />
      {displayField.hint && <small className="field-hint">{t(displayField.hint)}</small>}
      {showPath && (
        <small className="field-path">
          <code>{field.path}</code>
        </small>
      )}
    </div>
  );
}
