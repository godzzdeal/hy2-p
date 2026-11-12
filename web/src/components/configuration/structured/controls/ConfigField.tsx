import { Fieldset } from "@/components/ui/fields/Fieldset";
import { ConfigProperty } from "@/components/configuration/structured/ConfigProperty";
import { FieldControl } from "@/components/configuration/structured/controls/FieldControl";
import { FIELD_COPY } from "@/config/hysteria/structured/field-copy";
import { type IConfigField } from "@/services/configuration/structured/field-types";
import { cn } from "@/utils/cn";
import { useId } from "react";
export function ConfigField({
  field,
  value,
  onChange,
  disabledReason = "",
}: {
  field: IConfigField;
  disabledReason?: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = useId();
  const displayField = {
    ...field,
    label: field.path,
    hint: FIELD_COPY[field.path]?.hint ?? field.hint ?? field.label,
  };
  const isSet = value !== undefined && value !== null;
  const isDisabled = !!disabledReason;
  function onChangeValue(next: unknown) {
    if (!isDisabled) onChange(next);
  }
  return (
    <div
      className={cn("config-field min-w-0 grid grid-rows-subgrid row-span-2 gap-y-2", {
        "col-span-full": field.kind === "json" || field.kind === "pairs",
      })}
    >
      <ConfigProperty
        path={field.path}
        htmlFor={id}
        labelId={id + "-label"}
        hint={displayField.hint}
        disabledReason={disabledReason}
        canReset={isSet && !disabledReason}
        onReset={() => onChangeValue(undefined)}
      />
      <Fieldset className="config-control m-0 p-0 border-0 min-w-0" disabled={isDisabled}>
        <FieldControl id={id} field={displayField} value={value} onChange={onChangeValue} />
      </Fieldset>
    </div>
  );
}
