import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";

export interface IAnnouncement {
  defaultUserFlag?: string;
  profileTitle?: string;
  enabled: boolean;
  text: string;
  updateInterval: number;
}
export const ANNOUNCEMENT_LIMIT = 200;
export const MAX_UPDATE_HOURS = 168;
export const announcementApi = {
  read: () => request<IAnnouncement>(API_ROUTES.announcement),
  save: (body: IAnnouncement) => request<IAnnouncement>(API_ROUTES.announcement, { method: "PUT", body }),
};
