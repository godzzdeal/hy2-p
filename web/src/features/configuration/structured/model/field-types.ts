export type TFieldKind =
  "text" | "number" | "password" | "toggle" | "select" | "lines" | "multiline" | "json" | "pairs";
export interface IConfigField {
  path: string;
  label: string;
  kind: TFieldKind;
  options?: readonly string[];
  hint?: string;
  when?: { path: string; value: string };
}
export interface IConfigSection {
  id: string;
  title: string;
  fields: readonly IConfigField[];
}
