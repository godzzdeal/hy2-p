import { API_ROUTES, NETWORK } from "@/config/network";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { demoInput, demoState, unavailable } from "@/services/demo/state";
import { type IRequest } from "@/services/http/client";
export function demoSettings(path: string, instanceId: string, { method = "GET", body }: IRequest): unknown {
  const settings = demoState.settings[instanceId];
  if (!settings) return undefined;
  if (path === API_ROUTES.settings) {
    if (method === "PUT") {
      const history = demoState.history[instanceId] ?? [];
      history.unshift({
        id: Date.now(),
        created: new Date().toISOString(),
        settings: structuredClone(settings),
      });
      demoState.history[instanceId] = history.slice(0, NETWORK.pageSize);
      demoState.settings[instanceId] = demoInput<IConfiguration>(body);
      const instance = demoState.instances.find((item) => item.id === instanceId)!;
      Object.assign(instance, {
        host: demoState.settings[instanceId].host,
        port: demoState.settings[instanceId].port,
      });
      instance.portChangeRequired = instance.port !== instance.publishedPort;
    }
    return demoState.settings[instanceId];
  }
  if (path === API_ROUTES.history) return demoState.history[instanceId] ?? [];
  if (path === API_ROUTES.mimic)
    return {
      ready: false,
      container: true,
      managed: false,
      instanceId: "",
      kernel: "",
      interfaces: ["eth0"],
      checks: [{ id: "installation", ok: false, detail: "Включите режим установки Mimic" }],
    };
  if (path === API_ROUTES.hy2Certificates) {
    if (method !== "GET") return unavailable();
    return {
      mode: "acme",
      automaticRenewal: true,
      pinSHA256: "ab".repeat(32),
      certificates: [
        {
          path: "/data/acme/demo.crt",
          domains: [settings.host],
          notAfter: "2027-11-08T09:00:00Z",
          expired: false,
        },
      ],
    };
  }
  if (path === API_ROUTES.deployment) {
    const instance = demoState.instances.find((item) => item.id === instanceId)!;
    return {
      container: true,
      httpChallenge: true,
      agentAvailable: true,
      agentBusy: false,
      udpPublicPort: settings.port,
      udpListenPort: settings.port,
      publishedUdpPort: instance.publishedPort,
      publishedUdpListenPort: instance.listenPort,
      udpRestartRequired: instance.portChangeRequired,
      udpWarning: "",
    };
  }
  if (path === API_ROUTES.statsSecret)
    return {
      listen: "127.0.0.1:9999",
      secret: "DEMO-NOT-A-REAL-SECRET",
      running: true,
    };
  if (path === API_ROUTES.ech || path === API_ROUTES.udpApply) return unavailable();
  return undefined;
}
