export function normalizeVersion(value: string): string {
  return value.replace(/^app\//, "").replace(/^v/, "");
}
