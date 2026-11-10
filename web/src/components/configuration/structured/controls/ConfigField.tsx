import { Fieldset } from "@/components/ui/fields/Fieldset";
import { Field } from "@/components/ui/fields/Field";
import { Button } from "@/components/ui/button/Button";
import { FieldControl } from "@/components/configuration/structured/controls/FieldControl";
import { RotateCcw } from "@/components/elements/icons";
import { FIELD_COPY } from "@/config/hysteria/structured/field-copy";
import { FIELD_DEFAULTS } from "@/config/hysteria/structured/schema/documentation/defaults";
import { type IConfigField } from "@/services/configuration/structured/field-types";
import { cn } from "@/utils/cn";
import { useId } from "react";
import { useTranslation } from "react-i18next";
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
    <div
      className={cn("config-field min-w-0 grid grid-rows-subgrid row-span-3 gap-y-2", {
        "col-span-full": field.kind === "json" || field.kind === "pairs",
      })}
    >
      <div className="config-property flex items-center justify-between gap-2 min-h-control pl-2 border-l-4 border-accent bg-surface-soft">
        <Field htmlFor={id} id={id + "-label"} className="m-0">
          {field.path}
        </Field>
        <Button
          type="button"
          className="field-reset w-control min-w-control p-1"
          disabled={!isSet || !!disabledReason}
          aria-label={t("Сбросить {{field}}", { field: t(displayField.label) })}
          title={t("Вернуть значение по умолчанию")}
          onClick={() => onChange(undefined)}
        >
          <RotateCcw width={24} height={24} aria-hidden />
        </Button>
      </div>
      <Fieldset className="config-control m-0 p-0 border-0 min-w-0" disabled={!!disabledReason}>
        <FieldControl id={id} field={displayField} value={value} onChange={onChange} />
      </Fieldset>
      <div className="config-field-help">
        {disabledReason && <small className="field-hint">{t(disabledReason)}</small>}
        {showDescription && <small className="field-hint">{t(displayField.hint)}</small>}
        {FIELD_DEFAULTS[field.path] !== undefined && (
          <small className="field-default block mt-2 text-muted">
            {t("По умолчанию: {{value}}", { value: String(FIELD_DEFAULTS[field.path]) })}
          </small>
        )}
      </div>
    </div>
  );
}
