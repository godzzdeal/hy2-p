export const StorageProviderEnum = {
  Yandex: "yandex",
  Google: "google",
  Dropbox: "dropbox",
  OneDrive: "onedrive",
  S3: "s3",
  WebDAV: "webdav",
  Rclone: "rclone",
} as const;
export type TStorageProvider = (typeof StorageProviderEnum)[keyof typeof StorageProviderEnum];
export interface IStorage {
  id: string;
  name: string;
  provider: TStorageProvider;
  folder: string;
}
export interface IStorages {
  accounts: IStorage[];
}
export interface IStorageProvider {
  id: TStorageProvider;
  name: string;
  clientId?: string;
  hasSecret?: boolean;
  origin?: string;
}
export interface IStorageApplication {
  provider: TStorageProvider;
  clientId: string;
  clientSecret: string;
  origin: string;
}
export interface IStorageFields {
  name: string;
  provider: TStorageProvider;
  folder: string;
  endpoint: string;
  username: string;
  password: string;
  accessKey: string;
  secretKey: string;
  region: string;
  configText: string;
  destination: string;
}
export type TStorageChange =
  | ({ action: "create" } & IStorageFields)
  | { action: "update"; id: string; name: string; folder: string }
  | { action: "delete"; id: string };
export interface IStorageAuthorization {
  url: string;
  state: string;
  origin: string;
}
export interface IStorageCallback {
  type: "hy2-cloud-authorization";
  state: string;
  code: string;
  hasError: boolean;
}
export const STORAGE_QUERY_KEY = ["admin", "storages"] as const;
export const STORAGE_PROVIDER_KEY = ["admin", "storage-providers"] as const;
export const STORAGE_PROVIDERS: IStorageProvider[] = [
  { id: "yandex", name: "Яндекс Диск" },
  { id: "google", name: "Google Drive" },
  { id: "dropbox", name: "Dropbox" },
  { id: "onedrive", name: "OneDrive" },
  { id: "s3", name: "S3" },
  { id: "webdav", name: "WebDAV" },
  { id: "rclone", name: "Другое (rclone)" },
];
export const STORAGE_DEFAULTS: IStorageFields = {
  name: "",
  provider: "yandex",
  folder: "HY2-P",
  endpoint: "",
  username: "",
  password: "",
  accessKey: "",
  secretKey: "",
  region: "",
  configText: "",
  destination: "",
};
export function isBrowserStorage(provider: TStorageProvider): boolean {
  return provider !== "s3" && provider !== "webdav" && provider !== "rclone";
}
