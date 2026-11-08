import { API_ROUTES } from "@/config/network";
import { DEMO } from "@/services/demo/data";
import { demoState, unavailable } from "@/services/demo/state";
export function demoCore(path: string, instanceId: string): unknown {
  const instance = demoState.instances.find((item) => item.id === instanceId);
  if (!instance) return undefined;
  if (path === API_ROUTES.coreRollback) return unavailable();
  if (path === API_ROUTES.coreUpdate)
    return {
      current: instance.version,
      previous: "",
      busy: false,
      rollbackAvailable: false,
      result: { phase: "idle", message: "", target: "", started: "" },
    };
  if (path === API_ROUTES.coreVersions)
    return [{ tag: DEMO.coreVersion, published: DEMO.timestamp, available: true }];
  if (path === API_ROUTES.logs) {
    demoState.logs[instanceId] = "";
    return { logs: "" };
  }
  const action = ["start", "stop", "restart"].find((value) => path === API_ROUTES.control(value));
  if (action) {
    instance.running = action !== "stop";
    instance.desiredRunning = instance.running;
    demoState.logs[instanceId] = (demoState.logs[instanceId] ?? "") + "INFO  DEMO: " + action + "\n";
  }
  if (path === API_ROUTES.core || action)
    return {
      running: instance.running,
      available: true,
      binary: "/usr/local/bin/hysteria",
      logs: demoState.logs[instanceId] ?? "",
      watchdog: {
        desiredRunning: instance.running,
        state: instance.running ? "watching" : "idle",
        attempt: 0,
        maxAttempts: 3,
        message: "",
        lastCrash: "",
        lastError: "",
        nextRetry: "",
      },
    };
  return undefined;
}
