import { FIELD_COPY } from "../copy";
import { FIELD_DEFAULTS } from "../schema/documentation/defaults";
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
  showDescription = true,
  disabledReason = "",
}: {
  field: IConfigField;
  showDescription?: boolean;
  disabledReason?: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const displayField = {
    ...field,
    label: field.path,
    hint: FIELD_COPY[field.path]?.hint ?? field.hint ?? field.label,
  };
  const isSet = value !== undefined && value !== null;
  return (
    <div className={cn("config-field", { "col-span-full": field.kind === "json" || field.kind === "pairs" })}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} id={id + "-label"}>
          {field.path}
        </label>
        <button
          type="button"
          className="field-reset"
          disabled={!isSet || !!disabledReason}
          aria-label={t("Сбросить {{field}}", { field: t(displayField.label) })}
          title={t("Вернуть значение по умолчанию")}
          onClick={() => onChange(undefined)}
        >
          <RotateCcw width={24} height={24} aria-hidden />
        </button>
      </div>
      <fieldset className="config-control" disabled={!!disabledReason}>
        <FieldControl id={id} field={displayField} value={value} onChange={onChange} />
      </fieldset>
      {disabledReason && <small className="field-hint">{t(disabledReason)}</small>}
      {showDescription && <small className="field-hint">{t(displayField.hint)}</small>}
      {FIELD_DEFAULTS[field.path] !== undefined && (
        <small className="field-default">
          {t("По умолчанию: {{value}}", { value: String(FIELD_DEFAULTS[field.path]) })}
        </small>
      )}
    </div>
  );
}
