import { NETWORK } from "@/config/network";
import { type ISystemMetrics, type ISystemSample } from "@/services/admin/maintenance";

const HISTORY_WINDOW_MS = 10 * 60 * 1000;
const HISTORY_SAMPLES = HISTORY_WINDOW_MS / NETWORK.systemPollMs;
const DEMO_BYTES = 1024 * 1024;
export function demoSystem(): ISystemMetrics {
  const tick = Math.floor(Date.now() / NETWORK.systemPollMs);
  const samples: ISystemSample[] = Array.from({ length: HISTORY_SAMPLES }, (_, index) => {
    const position = tick - HISTORY_SAMPLES + index + 1;
    const wave = Math.sin(position / 6);
    return {
      time: position * NETWORK.systemPollMs,
      cpu: 18 + wave * 12,
      memory: 36 + wave * 2,
      load: 0.4 + wave * 0.2,
      receive: (2 + wave) * DEMO_BYTES,
      transmit: (4 - wave) * DEMO_BYTES,
    };
  });
  return {
    available: true,
    scope: "host",
    cpus: 4,
    uptime: 86400,
    memoryTotal: 4096 * DEMO_BYTES,
    memoryUsed: 1474 * DEMO_BYTES,
    received: 18432 * DEMO_BYTES,
    transmitted: 40960 * DEMO_BYTES,
    samples,
    storage: {
      managed: true,
      data: 128 * DEMO_BYTES,
      backups: 384 * DEMO_BYTES,
      releases: 96 * DEMO_BYTES,
      other: DEMO_BYTES,
      images: 256 * DEMO_BYTES,
      archives: 96 * DEMO_BYTES,
      imageCount: 1,
      updated: Date.now(),
      complete: true,
    },
  };
}
