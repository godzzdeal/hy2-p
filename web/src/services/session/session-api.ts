import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
export interface ISession {
  ok: boolean;
}
export interface ILoginCredentials {
  username: string;
  password: string;
}
export interface ICloudChallenge {
  ok: false;
  cloudPasswordRequired: true;
  challenge: string;
}
export type TLoginResult = ISession | ICloudChallenge;
export const sessionApi = {
  read: () => request<ISession>(API_ROUTES.session),
  login: (body: ILoginCredentials) => request<TLoginResult>(API_ROUTES.login, { method: "POST", body }),
  cloudLogin: (body: { challenge: string; password: string }) =>
    request<ISession>(API_ROUTES.cloudLogin, { method: "POST", body }),
  logout: () => request<ISession>(API_ROUTES.logout, { method: "POST" }),
};
