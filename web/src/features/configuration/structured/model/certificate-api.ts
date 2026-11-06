import { instanceRoute } from "@/features/instances/model";
import { request, API_ROUTES } from "@/shared/http";
export interface ICertificateInfo {
  path: string;
  domains: string[];
  notAfter: string;
  expired: boolean;
}
export interface ICertificateStatus {
  mode: string;
  automaticRenewal: boolean;
  certificates: ICertificateInfo[];
}
export interface ICertificateUpload {
  certificatePath: string;
  keyPath: string;
  notAfter: string;
}
export const certificateApi = {
  read: (id?: string) =>
    request<ICertificateStatus>(instanceRoute(instanceRoute(API_ROUTES.hy2Certificates, id), id)),
  upload: (body: { certificate: string; privateKey: string }, id?: string) =>
    request<ICertificateUpload>(instanceRoute(API_ROUTES.hy2Certificates, id), { method: "POST", body }),
};
