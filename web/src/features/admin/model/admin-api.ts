import { request, API_ROUTES } from "@/shared/http";
import type { IAccount, IAccountChange, IWebConfig, IWebSettings } from "./admin-types";
export const adminApi = {
  account: () => request<IAccount>(API_ROUTES.adminAccount),
  changeAccount: (body: IAccountChange) =>
    request<IAccount>(API_ROUTES.adminAccount, { method: "PUT", body }),
  web: () => request<IWebSettings>(API_ROUTES.adminWeb),
  saveWeb: (body: IWebConfig) => request<IWebSettings>(API_ROUTES.adminWeb, { method: "PUT", body }),
};
