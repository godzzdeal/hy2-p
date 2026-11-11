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
export const EMPTY_USAGE: IUserUsage = {
  upload: 0,
  download: 0,
  limit: 0,
  online: 0,
  lastSeen: "",
};
export const TRAFFIC_POLL_MS = 5000;
export { BYTE_UNITS, formatBytes } from "./byte-format";
