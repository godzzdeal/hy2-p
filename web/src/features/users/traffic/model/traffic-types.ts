export interface IUserUsage {
  groupLimit?: number;
  upload: number;
  download: number;
  limit: number;
  online: number;
  lastSeen: string;
}
export function trafficLimit(usage: IUserUsage): number {
  const group = usage.groupLimit ?? 0;
  return group > 0 && (usage.limit === 0 || group < usage.limit) ? group : usage.limit;
}
export interface ITraffic {
  users: Record<string, IUserUsage>;
  available: boolean;
  updated: string;
  error: string;
}
export const EMPTY_USAGE: IUserUsage = { upload: 0, download: 0, limit: 0, online: 0, lastSeen: "" };
export const TRAFFIC_POLL_MS = 5000;
export const BYTE_UNITS = {
  byte: 1,
  kilobyte: 1024,
  megabyte: 1024 ** 2,
  gigabyte: 1024 ** 3,
  terabyte: 1024 ** 4,
} as const;
export function formatBytes(bytes: number, translate: (unit: string) => string = (unit) => unit): string {
  if (bytes < BYTE_UNITS.kilobyte) return bytes + " " + translate("Б");
  const units = ["КБ", "МБ", "ГБ", "ТБ"];
  let value = bytes / BYTE_UNITS.kilobyte;
  let index = 0;
  while (value >= BYTE_UNITS.kilobyte && index < units.length - 1) {
    value /= BYTE_UNITS.kilobyte;
    index++;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " " + translate(units[index]);
}
