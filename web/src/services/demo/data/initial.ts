import { DEMO, type IDemoState } from "@/services/demo/data/types";
import { BYTE_UNITS } from "@/services/users/traffic/traffic-types";
export function initialDemoState(): IDemoState {
  const users = ["🇳🇱 Телефон", "🇩🇪 Ноутбук", "🇫🇮 Рабочий ПК", "🇳🇱 Планшет"].map((name, index) => ({
    id: "100000000000000" + index,
    name,
    enabled: index !== 3,
    expires: "",
    created: DEMO.timestamp,
  }));
  const settings = {
    authMode: "panel" as const,
    host: DEMO.hostname,
    sni: DEMO.hostname,
    port: "8443",
    config:
      "listen: :8443\nacme:\n  domains:\n    - vpn.example.invalid\n  email: demo@example.invalid\n  ca: letsencrypt\nobfs:\n  type: salamander\n  salamander:\n    password: demo-not-a-real-secret\ncongestion:\n  type: bbr\n  bbrProfile: standard\ndisableUDP: false\n",
  };
  const instance = {
    id: "default",
    name: "Основной",
    slot: 0,
    running: true,
    desiredRunning: true,
    updating: false,
    version: DEMO.coreVersion,
    host: DEMO.hostname,
    port: "8443",
    publishedPort: "8443",
    listenPort: "8443",
    portChangeRequired: false,
    authMode: "panel",
  };
  const group = {
    id: DEMO.groupId,
    name: "Семья",
    color: "purple" as const,
    access: { mode: "all" as const, instances: [] },
    trafficLimit: 0,
    deviceLimit: 0,
  };
  return {
    isAuthorized: true,
    users,
    instances: [
      instance,
      {
        ...instance,
        id: "example",
        name: "Запасной",
        slot: 1,
        port: "9443",
        publishedPort: "9443",
        listenPort: "9443",
      },
    ],
    settings: {
      default: settings,
      example: { ...settings, port: "9443", config: settings.config.replace(":8443", ":9443") },
    },
    history: {},
    access: {},
    groups: {
      groups: [group, { ...group, id: DEMO.secondGroupId, name: "Команда", color: "cyan" }],
      memberships: Object.fromEntries(
        users.map((user, index) => [user.id, index < 2 ? DEMO.groupId : DEMO.secondGroupId]),
      ),
    },
    devices: Object.fromEntries(
      users.map((user) => [
        user.id,
        {
          limit: 0,
          devices: [
            {
              id: DEMO.deviceId,
              model: "Тестовый телефон",
              os: "iOS",
              osVersion: "18",
              app: "Happ",
              firstSeen: DEMO.timestamp,
              lastSeen: DEMO.timestamp,
              subscriptionIp: "192.0.2.10",
              lastConnected: DEMO.timestamp,
              connectionIp: "192.0.2.10",
              core: "default",
              blocked: false,
              statusAvailable: true,
              online: 1,
            },
          ],
        },
      ]),
    ),
    logs: {
      default: `INFO  server mode\nINFO  server up and running {"listen":":8443"}\nINFO  client connected {"addr":"192.0.2.10:51000","id":"${users[0].id}"}\n`,
      example: 'INFO  server up and running {"listen":":9443"}\n',
    },
    traffic: {
      available: true,
      updated: DEMO.timestamp,
      error: "",
      users: Object.fromEntries(
        users.map((user, index) => [
          user.id,
          {
            upload: (index + 1) * 128 * BYTE_UNITS.megabyte,
            download: (index + 1) * BYTE_UNITS.gigabyte,
            limit: 20 * BYTE_UNITS.gigabyte,
            online: index < 2 ? 1 : 0,
            lastSeen: DEMO.timestamp,
          },
        ]),
      ),
    },
    announcement: { enabled: false, text: "", updateInterval: 1, profileTitle: "🚀 HY2-P Demo" },
  };
}
