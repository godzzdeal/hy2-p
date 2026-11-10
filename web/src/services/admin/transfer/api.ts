import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
export const TRANSFER_LIMIT = 16 * 1024 * 1024;
export const EXCLUDE_PROFILE = "skip";
export interface ITransferRow {
  target?: string;
  kind: "core" | "group" | "user";
  id: string;
  name: string;
  action: "add" | "added" | "skip" | "conflict" | "failed";
  reason: string;
}
export interface ITransferPreview {
  rows: ITransferRow[];
  fingerprint: string;
}
export const transferApi = {
  export: () => request<unknown>(API_ROUTES.transfer),
  preview: (bundle: unknown) =>
    request<ITransferPreview>(API_ROUTES.transferMode("preview"), { method: "POST", body: { bundle } }),
  apply: (bundle: unknown, fingerprint: string) =>
    request<ITransferPreview>(API_ROUTES.transferMode("apply"), {
      method: "POST",
      body: { bundle, fingerprint },
    }),
};
