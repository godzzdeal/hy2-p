import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";

export interface IAnnouncement {
  routing?: IClientRouting;
  defaultUserFlag?: string;
  profileTitle?: string;
  enabled: boolean;
  text: string;
  updateInterval: number;
}
export interface IClientRouting {
  enabled: boolean;
  domains: string[];
  hasProfile?: boolean;
}
export const CLIENT_ROUTING_LIMIT = 64;
export const ANNOUNCEMENT_LIMIT = 200;
export const MAX_UPDATE_HOURS = 168;
export const announcementApi = {
  read: () => request<IAnnouncement>(API_ROUTES.announcement),
  save: (body: IAnnouncement) => request<IAnnouncement>(API_ROUTES.announcement, { method: "PUT", body }),
};
