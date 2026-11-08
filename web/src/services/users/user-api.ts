import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import {
  type IConnectionLinks,
  type IUser,
  type IUserInput,
  type IUserUpdate,
} from "@/services/users/user-types";
export const userApi = {
  list: () => request<IUser[]>(API_ROUTES.users),
  create: (body: IUserInput) => request<IUser>(API_ROUTES.users, { method: "POST", body }),
  update: ({ id, body }: { id: string; body: IUserUpdate }) =>
    request<IUser>(API_ROUTES.user(id), { method: "PATCH", body }),
  remove: (id: string) => request<{ ok: boolean }>(API_ROUTES.user(id), { method: "DELETE" }),
  links: (id: string) => request<IConnectionLinks>(API_ROUTES.links(id)),
  rotate: (id: string) => request<{ ok: boolean }>(API_ROUTES.rotate(id), { method: "POST" }),
};
