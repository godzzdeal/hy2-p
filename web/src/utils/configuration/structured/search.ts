import { type IConfigField } from "@/services/configuration/structured/field-types";
function normalizeProperty(value: string): string {
  return value
    .replace(/\[\d*\]/g, "")
    .trim()
    .toLowerCase();
}
export function matchesProperty(field: IConfigField, search: string): boolean {
  const term = normalizeProperty(search);
  return !term || normalizeProperty(field.path + " " + field.label + " " + (field.hint ?? "")).includes(term);
}
export function filterProperties(fields: readonly IConfigField[], search: string): readonly IConfigField[] {
  const matches = fields.filter((field) => matchesProperty(field, search));
  const parents = new Set(matches.flatMap((field) => (field.when ? [field.when.path] : [])));
  return fields.filter((field) => matches.includes(field) || parents.has(field.path));
}
