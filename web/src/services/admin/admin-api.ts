import { API_ROUTES } from "@/config/network";
import {
  type IAccount,
  type IBackupInput,
  type IBackupSettings,
  type IAccountChange,
  type IWebConfig,
  type IWebSettings,
} from "@/services/admin/admin-types";
import { request } from "@/services/http/client";
export const adminApi = {
  account: () => request<IAccount>(API_ROUTES.adminAccount),
  changeAccount: (body: IAccountChange) =>
    request<IAccount>(API_ROUTES.adminAccount, { method: "PUT", body }),
  web: () => request<IWebSettings>(API_ROUTES.adminWeb),
  saveWeb: (body: IWebConfig) => request<IWebSettings>(API_ROUTES.adminWeb, { method: "PUT", body }),
};

export const backupsApi = {
  read: () => request<IBackupSettings>(API_ROUTES.backups),
  save: (body: IBackupInput) => request<IBackupSettings>(API_ROUTES.backups, { method: "PUT", body }),
};
