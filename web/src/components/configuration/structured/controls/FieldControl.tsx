import { Textarea } from "@/components/ui/fields/controls/Textarea";
import { Input } from "@/components/ui/fields/controls/Input";
import { FieldOption } from "@/components/configuration/structured/controls/FieldOption";
import { JsonField } from "@/components/configuration/structured/fields/JsonField";
import { PairEditor } from "@/components/configuration/structured/fields/PairEditor";
import { PasswordField } from "@/components/elements/security/PasswordField";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { type IConfigField } from "@/services/configuration/structured/field-types";
import { formatField, parseField } from "@/utils/configuration/structured/yaml/fields";
import { useTranslation } from "react-i18next";
export function FieldControl({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: IConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { t } = useTranslation();
  const formatted = formatField(value, field.kind);
  if (field.kind === "password")
    return (
      <PasswordField
        id={id}
        hasLabel={false}
        minLength={0}
        label={t(field.label)}
        value={formatted}
        onChange={onChange}
      />
    );
  if (field.kind === "toggle")
    return (
      <Select
        id={id}
        value={value == null ? "" : String(value)}
        onValueChange={(next) => onChange(next === "" ? undefined : next === "true")}
      >
        <SelectOption value="">{t("По умолчанию")}</SelectOption>
        <SelectOption value="true">true</SelectOption>
        <SelectOption value="false">false</SelectOption>
      </Select>
    );
  if (field.kind === "select") {
    const options = field.options ?? [];
    return (
      <Select id={id} value={formatted} onValueChange={onChange}>
        <SelectOption value="">{t("По умолчанию")}</SelectOption>
        {formatted && !options.includes(formatted) && <FieldOption value={formatted} />}
        {options.map((option) => (
          <FieldOption key={option} value={option} />
        ))}
      </Select>
    );
  }
  if (field.kind === "pairs")
    return (
      <div role="group" aria-labelledby={id + "-label"}>
        <PairEditor value={value} onChange={onChange} hasGenerator={field.path === "auth.userpass"} />
      </div>
    );
  if (field.kind === "json" || field.kind === "multiline")
    return <JsonField id={id} value={formatted} onChange={onChange} multiline={field.kind === "multiline"} />;
  if (field.kind === "lines")
    return (
      <Textarea
        id={id}
        value={formatted}
        onChange={(event) => onChange(parseField(event.target.value, field.kind))}
      />
    );
  return (
    <Input
      id={id}
      type={field.kind === "number" ? "number" : "text"}
      value={formatted}
      onChange={(event) => onChange(parseField(event.target.value, field.kind))}
    />
  );
}
