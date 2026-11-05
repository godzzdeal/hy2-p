export interface IUserUsage {
  upload: number;
  download: number;
  limit: number;
  online: number;
  lastSeen: string;
}
export interface ITraffic {
  users: Record<string, IUserUsage>;
  available: boolean;
  updated: string;
  error: string;
}
export const EMPTY_USAGE: IUserUsage = { upload: 0, download: 0, limit: 0, online: 0, lastSeen: "" };
export const TRAFFIC_POLL_MS = 5000;
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  const units = ["KiB", "MiB", "GiB", "TiB"];
  let value = bytes / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " " + units[index];
}
