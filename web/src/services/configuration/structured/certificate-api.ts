import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { instanceRoute } from "@/services/instances/scope";
export interface ICertificateInfo {
  path: string;
  domains: string[];
  notAfter: string;
  expired: boolean;
  pinSHA256?: string;
}
export interface ICertificateStatus {
  mode: string;
  automaticRenewal: boolean;
  certificates: ICertificateInfo[];
  pinSHA256?: string;
  pinError?: string;
}
export interface ICertificateUpload {
  certificatePath: string;
  keyPath: string;
  notAfter: string;
}
export const certificateApi = {
  read: (id?: string) => request<ICertificateStatus>(instanceRoute(API_ROUTES.hy2Certificates, id)),
  upload: (body: { certificate: string; privateKey: string }, id?: string) =>
    request<ICertificateUpload>(instanceRoute(API_ROUTES.hy2Certificates, id), { method: "POST", body }),
};
