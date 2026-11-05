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
  read: () => request<ICertificateStatus>(API_ROUTES.hy2Certificates),
  upload: (body: { certificate: string; privateKey: string }) =>
    request<ICertificateUpload>(API_ROUTES.hy2Certificates, { method: "POST", body }),
};
