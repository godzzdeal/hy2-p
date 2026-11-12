export interface IAccount {
  username: string;
}
export interface IAccountChange {
  username: string;
  currentPassword: string;
  password: string;
}
export interface IWebConfig {
  host: string;
  port: number;
  mode: "http" | "manual" | "acme";
  domain: string;
  email: string;
  challengePort: number;
  certificate: string;
  privateKey?: string;
  acceptedTerms: boolean;
  publicURL: string;
}
export interface IWebSettings {
  config: IWebConfig;
  hasPrivateKey: boolean;
  restartRequired: boolean;
  container: boolean;
  activeURL: string;
}
export interface IBackupSettings {
  destination: string;
  hasConfig: boolean;
}
export interface IBackupInput {
  destination: string;
  configText?: string;
}
