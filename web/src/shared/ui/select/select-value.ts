export const EMPTY_SELECT_VALUE = "__hy2_default__";
export function encodeSelectValue(value: string | number): string {
  return value === "" ? EMPTY_SELECT_VALUE : String(value);
}
