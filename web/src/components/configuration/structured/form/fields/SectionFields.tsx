import { FieldGrid } from "@/components/ui/fields/FieldGrid";
import { ConfigField } from "@/components/configuration/structured/controls/ConfigField";
import { type IConfigField } from "@/services/configuration/structured/field-types";
import { fieldAvailability } from "@/utils/configuration/structured/form/fields/availability";
import { readField } from "@/utils/configuration/structured/yaml/fields";
import { type Document } from "yaml";
export function SectionFields({
  fields,
  document,
  isNative,
  isManagedHttp,
  search,
  onSet,
}: {
  fields: readonly IConfigField[];
  document: Document;
  isNative: boolean;
  isManagedHttp: boolean;
  search: string;
  onSet: (path: string, value: unknown) => void;
}) {
  return (
    <FieldGrid columns={2} className="p-0">
      {fields
        .filter((field) => search || fieldAvailability(field, document, isNative, isManagedHttp).isVisible)
        .map((field) => (
          <ConfigField
            key={field.path}
            field={field}
            value={readField(document, field.path)}
            disabledReason={fieldAvailability(field, document, isNative, isManagedHttp).reason}
            onChange={(value) => onSet(field.path, value)}
          />
        ))}
    </FieldGrid>
  );
}
