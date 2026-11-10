export interface ISystemSample {
  time: number;
  cpu: number;
  memory: number;
  load: number;
  receive: number;
  transmit: number;
}
export interface ISystemStorage {
  managed: boolean;
  data: number;
  backups: number;
  releases: number;
  other: number;
  images: number;
  imageCount: number;
  updated: number;
  complete: boolean;
  message?: string;
}
export interface ISystemMetrics {
  available: boolean;
  scope: "host" | "container";
  cpus: number;
  uptime: number;
  memoryTotal: number;
  memoryUsed: number;
  received: number;
  transmitted: number;
  samples: ISystemSample[];
  storage: ISystemStorage;
  error?: string;
}
