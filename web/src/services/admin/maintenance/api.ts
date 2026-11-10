import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { type ISystemMetrics } from "@/services/admin/maintenance/types";

export const maintenanceApi = {
  metrics: () => request<ISystemMetrics>(API_ROUTES.system),
};
