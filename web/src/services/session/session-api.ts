import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
export interface ISession {
  ok: boolean;
}
export const sessionApi = {
  read: () => request<ISession>(API_ROUTES.session),
  login: ({ username, password }: { username: string; password: string }) =>
    request<ISession>(API_ROUTES.login, { method: "POST", body: { username, password } }),
  logout: () => request<ISession>(API_ROUTES.logout, { method: "POST" }),
};
