import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { type IUserAccess } from "@/services/users/access/types";
export const userAccessApi = {
  read: (id: string) => request<IUserAccess>(API_ROUTES.userCores(id)),
  save: (id: string, body: IUserAccess) =>
    request<IUserAccess>(API_ROUTES.userCores(id), { method: "PUT", body }),
};
