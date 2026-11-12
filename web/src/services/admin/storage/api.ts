import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import type {
  IStorages,
  IStorage,
  IStorageFields,
  IStorageProvider,
  IStorageAuthorization,
  IStorageApplication,
  TStorageChange,
} from "@/services/admin/storage/types";
export const storageApi = {
  saveProvider: (body: IStorageApplication) =>
    request<{ ok: boolean }>(API_ROUTES.storages, { method: "POST", body: { ...body, action: "provider" } }),
  read: () => request<IStorages>(API_ROUTES.storages),
  providers: () =>
    request<{ providers: IStorageProvider[] }>(API_ROUTES.storages, {
      method: "POST",
      body: { action: "providers" },
    }),
  change: (body: TStorageChange) => request<IStorage[]>(API_ROUTES.storages, { method: "POST", body }),
  authorize: (body: IStorageFields & { origin: string }) =>
    request<IStorageAuthorization>(API_ROUTES.storages, {
      method: "POST",
      body: { ...body, action: "authorize" },
    }),
  complete: (body: { state: string; code: string }) =>
    request<IStorage[]>(API_ROUTES.storages, { method: "POST", body: { ...body, action: "complete" } }),
};
