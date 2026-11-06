import { type Document } from "yaml";
import { ConfigField } from "@/features/configuration/structured/controls";
import { type IConfigField, readField } from "@/features/configuration/structured/model";
import { fieldAvailability } from "./availability";
export function SectionFields({
  fields,
  document,
  isNative,
  isManagedHttp,
  search,
  showDescription,
  onSet,
}: {
  fields: readonly IConfigField[];
  document: Document;
  isNative: boolean;
  isManagedHttp: boolean;
  search: string;
  showDescription: boolean;
  onSet: (path: string, value: unknown) => void;
}) {
  return (
    <div className="field-grid">
      {fields
        .filter((field) => search || fieldAvailability(field, document, isNative, isManagedHttp).isVisible)
        .map((field) => (
          <ConfigField
            key={field.path}
            field={field}
            value={readField(document, field.path)}
            showDescription={showDescription}
            disabledReason={fieldAvailability(field, document, isNative, isManagedHttp).reason}
            onChange={(value) => onSet(field.path, value)}
          />
        ))}
    </div>
  );
}
