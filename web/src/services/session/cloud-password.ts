import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";

export const MIN_CLOUD_PASSWORD = 12;
export interface ICloudPasswordSettings {
  enabled: boolean;
}
export interface ICloudPasswordChange {
  currentPassword: string;
  currentCloudPassword: string;
  password: string;
}
export const cloudPasswordApi = {
  read: () => request<ICloudPasswordSettings>(API_ROUTES.cloudPassword),
  save: (body: ICloudPasswordChange) =>
    request<{ loginRequired: boolean }>(API_ROUTES.cloudPassword, { method: "PUT", body }),
};
