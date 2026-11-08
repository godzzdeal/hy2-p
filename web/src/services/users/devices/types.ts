export const MAX_USER_DEVICES = 100;
export interface IDevice {
  online?: number;
  statusAvailable?: boolean;
  id: string;
  model: string;
  os: string;
  osVersion: string;
  app: string;
  firstSeen: string;
  lastSeen: string;
  subscriptionIp: string;
  lastConnected: string;
  connectionIp: string;
  core: string;
  blocked: boolean;
}
export interface IDevices {
  effectiveLimit?: number;
  limit: number;
  devices: IDevice[];
}
