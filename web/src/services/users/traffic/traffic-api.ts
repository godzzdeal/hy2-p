import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { type ITraffic, type IUserUsage } from "@/services/users/traffic/traffic-types";
export const trafficApi = {
  read: () => request<ITraffic>(API_ROUTES.traffic),
  adjust: ({
    id,
    upload,
    download,
    limit,
  }: {
    id: string;
    upload?: number;
    download?: number;
    limit: number;
  }) =>
    request<IUserUsage>(API_ROUTES.userTraffic(id), {
      method: "PUT",
      body: { upload, download, limit },
    }),
};
