export const BYTE_UNITS = {
  byte: 1,
  kilobyte: 1024,
  megabyte: 1024 ** 2,
  gigabyte: 1024 ** 3,
  terabyte: 1024 ** 4,
} as const;

const UNIT_LABELS = ["Б", "КБ", "МБ", "ГБ", "ТБ"] as const;
const UNIT_FACTORS = Object.values(BYTE_UNITS);
const NUMBER_OPTIONS = { maximumFractionDigits: 2 } as const;
type TTranslateUnit = (unit: string) => string;
const identity: TTranslateUnit = (unit) => unit;

function unitIndex(bytes: number): number {
  let index = 0;
  while (index < UNIT_FACTORS.length - 1 && bytes >= UNIT_FACTORS[index + 1]) index++;
  return index;
}

export function formatBytes(bytes: number, translate = identity, locale?: string): string {
  const index = unitIndex(bytes);
  return (
    (bytes / UNIT_FACTORS[index]).toLocaleString(locale, NUMBER_OPTIONS) + " " + translate(UNIT_LABELS[index])
  );
}

export function formatUsage(bytes: number, limit: number, translate = identity, locale?: string): string {
  if (limit <= 0) return formatBytes(bytes, translate, locale) + "/∞";
  const index = unitIndex(Math.max(bytes, limit));
  const used = (bytes / UNIT_FACTORS[index]).toLocaleString(locale, NUMBER_OPTIONS);
  const maximum = (limit / UNIT_FACTORS[index]).toLocaleString(locale, NUMBER_OPTIONS);
  return used + "/" + maximum + " " + translate(UNIT_LABELS[index]);
}
