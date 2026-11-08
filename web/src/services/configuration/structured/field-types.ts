export type TFieldKind =
  "text" | "number" | "password" | "toggle" | "select" | "lines" | "multiline" | "json" | "pairs";
export interface IConfigField {
  managed?: boolean;
  path: string;
  label: string;
  kind: TFieldKind;
  options?: readonly string[];
  hint?: string;
  when?: { path: string; value: string };
}
export interface IConfigSection {
  anchor?: string;
  id: string;
  title: string;
  fields: readonly IConfigField[];
}

export interface IFieldCopy {
  label: string;
  hint: string;
}
