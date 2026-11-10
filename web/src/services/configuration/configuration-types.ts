export interface IConfiguration {
  authMode?: "panel" | "native";
  host: string;
  port: string;
  sni: string;
  pinSHA256?: string;
  pinFromCertificate?: boolean;
  config: string;
}
export interface IRevision {
  id: number;
  created: string;
  settings: IConfiguration;
}
