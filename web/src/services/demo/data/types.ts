import { type IAnnouncement } from "@/services/admin/announcement";
import { type IConfiguration, type IRevision } from "@/services/configuration/configuration-types";
import { type IGroups } from "@/services/groups/types";
import { type IInstance } from "@/services/instances/types";
import { type IUser } from "@/services/users/user-types";
import { type IUserAccess } from "@/services/users/access/types";
import { type IDevices } from "@/services/users/devices/types";
import { type ITraffic } from "@/services/users/traffic/traffic-types";
export interface IDemoState {
  isAuthorized: boolean;
  users: IUser[];
  groups: IGroups;
  instances: IInstance[];
  settings: Record<string, IConfiguration>;
  history: Record<string, IRevision[]>;
  access: Record<string, IUserAccess>;
  devices: Record<string, IDevices>;
  logs: Record<string, string>;
  traffic: ITraffic;
  announcement: IAnnouncement;
}
export const DEMO = {
  userLimit: 100,
  timestamp: "2026-11-08T09:00:00Z",
  hostname: "vpn.example.invalid",
  groupId: "1111111111111111",
  secondGroupId: "2222222222222222",
  deviceId: "demo-phone",
  version: "v0.7.3",
  coreVersion: "v2.13.0",
} as const;
