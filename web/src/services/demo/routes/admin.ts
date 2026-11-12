import { API_ROUTES } from "@/config/network";
import { type IAnnouncement } from "@/services/admin/announcement";
import { DEMO } from "@/services/demo/data";
import { demoInput, demoState, unavailable } from "@/services/demo/state";
import { type IRequest } from "@/services/http/client";
export function demoAdmin(path: string, { method = "GET", body }: IRequest): unknown {
  if (path === API_ROUTES.announcement) {
    if (method === "PUT") demoState.announcement = demoInput<IAnnouncement>(body);
    return demoState.announcement;
  }
  if (path === API_ROUTES.panelVersion) return { version: DEMO.version, revision: "demo" };
  if (path === API_ROUTES.storages && method === "GET") return { accounts: [] };
  if (path === API_ROUTES.panelMaintenance) {
    if (method !== "GET") return unavailable();
    return {
      available: true,
      current: DEMO.version,
      previous: "",
      backupCreated: "",
      rollbackAvailable: false,
      operation: { busy: false, phase: "idle" },
    };
  }
  if (path === API_ROUTES.panelVersions) return [{ version: DEMO.version, published: DEMO.timestamp }];
  if (path === API_ROUTES.panelRelease)
    return {
      current: DEMO.version,
      latest: DEMO.version,
      state: "current",
      url: "https://github.com/godzzdeal/hy2-p/releases/latest",
      checkedAt: new Date().toISOString(),
      publishedAt: DEMO.timestamp,
    };
  if (method !== "GET") return unavailable();
  if (path === API_ROUTES.adminAccount) return { username: "demo" };
  if (path === API_ROUTES.cloudPassword) return { enabled: false };
  if (path === API_ROUTES.adminWeb)
    return {
      container: true,
      hasPrivateKey: false,
      restartRequired: false,
      activeURL: window.location.origin,
      config: {
        host: "0.0.0.0",
        port: 9443,
        mode: "acme",
        domain: DEMO.hostname,
        email: "demo@example.invalid",
        challengePort: 9080,
        certificate: "",
        publicURL: window.location.origin,
        acceptedTerms: true,
      },
    };
  if (path === API_ROUTES.firewall)
    return {
      active: true,
      protectedPorts: [22, 9443],
      output:
        "Status: active\n\nTo                         Action      From\n--                         ------      ----\n22/tcp                     ALLOW IN    Anywhere\n9443/tcp                   ALLOW IN    Anywhere\n80/tcp                     ALLOW IN    Anywhere\n8443/udp                   ALLOW IN    Anywhere\n",
    };
  if (path === API_ROUTES.firewallPorts)
    return {
      warnings: [],
      ports: [
        {
          port: 9443,
          protocol: "tcp",
          purpose: "panel",
          source: "HY2-P",
          pending: false,
        },
        {
          port: 80,
          protocol: "tcp",
          purpose: "acme-http",
          source: "ACME",
          pending: false,
        },
        ...demoState.instances.map((instance) => ({
          port: Number(instance.port),
          protocol: "udp",
          purpose: "vpn",
          source: instance.name,
          pending: instance.portChangeRequired,
        })),
      ],
    };
  return undefined;
}
