import { request, API_ROUTES } from "@/shared/http";
import { type ITraffic, type IUserUsage } from "./traffic-types";
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
  }) => request<IUserUsage>(API_ROUTES.userTraffic(id), { method: "PUT", body: { upload, download, limit } }),
};
