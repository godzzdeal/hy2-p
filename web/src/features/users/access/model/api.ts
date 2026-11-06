import { request, API_ROUTES } from "@/shared/http";
import { type IUserAccess } from "./types";
export const userAccessApi = {
  read: (id: string) => request<IUserAccess>(API_ROUTES.userCores(id)),
  save: (id: string, body: IUserAccess) =>
    request<IUserAccess>(API_ROUTES.userCores(id), { method: "PUT", body }),
};
