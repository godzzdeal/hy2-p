export interface IConfiguration {
  authMode?: "panel" | "native";
  host: string;
  port: string;
  sni: string;
  config: string;
}
export interface IRevision {
  id: number;
  created: string;
  settings: IConfiguration;
}
