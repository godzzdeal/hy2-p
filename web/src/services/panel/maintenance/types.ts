import { type IPortOperation } from "@/services/configuration/deployment/operation/api";

export const PanelActionEnum = {
  Update: "update",
  Rollback: "rollback",
  Restart: "restart",
  Cleanup: "cleanup",
  Backup: "backup",
  CloudBackup: "backup-cloud",
} as const;
export type TPanelAction = (typeof PanelActionEnum)[keyof typeof PanelActionEnum];
export type TPanelRequest =
  | { action: "update"; version: string }
  | { action: "rollback"; restoreData: true }
  | { action: "restart"; targetURL?: string }
  | { action: "backup" | "backup-cloud" }
  | { action: "cleanup" };
export interface IPanelOperation extends Omit<IPortOperation, "phase"> {
  phase: IPortOperation["phase"] | "queued" | "updating" | "rolling_back" | "cleaning";
  operation?: TPanelAction;
  version?: string;
}
export interface IPanelInstallation {
  available: boolean;
  current: string;
  previous: string;
  backupCreated: string;
  rollbackAvailable: boolean;
  operation: IPanelOperation;
}
export interface IPanelVersion {
  version: string;
  published: string;
}
