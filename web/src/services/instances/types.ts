export const DEFAULT_INSTANCE = "default";
export const MAX_INSTANCES = 8;
export interface IInstance {
  id: string;
  name: string;
  slot: number;
  removing?: boolean;
  removalTicket?: string;
  running: boolean;
  desiredRunning?: boolean;
  version: string;
  updating: boolean;
  host: string;
  port: string;
  listenPort: string;
  publishedPort: string;
  portChangeRequired: boolean;
  authMode: string;
  error?: string;
}
