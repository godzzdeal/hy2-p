import { type IConfiguration } from "@/features/configuration/model";
export const PANEL_METADATA: Record<string, unknown> = {
  "/api/groups": { groups: [], memberships: {} },
  "/api/instances": [
    {
      id: "default",
      name: "Основной",
      slot: 0,
      running: true,
      updating: false,
      version: "v2.13.0",
      host: "vpn.example.org",
      port: "8443",
      publishedPort: "8443",
      listenPort: "8443",
      portChangeRequired: false,
      authMode: "panel",
    },
  ],
  "/api/version": { version: "v0.2.1", revision: "test-build" },
  "/api/panel/update": {
    current: "v0.2.1",
    latest: "v0.2.1",
    state: "current",
    url: "https://github.com/godzzdeal/hy2-p/releases/tag/v0.2.1",
    publishedAt: "2026-11-05T00:00:00Z",
    checkedAt: "2026-11-06T00:00:00Z",
  },
};
export const INITIAL_SETTINGS: IConfiguration = {
  host: "vpn.example.org",
  port: "8443",
  sni: "vpn.example.org",
  authMode: "panel",
  config:
    "listen: :8443\ntls:\n  cert: /certs/server.crt\n  key: /certs/server.key\ncongestion:\n  type: bbr\n  bbrProfile: aggressive\nspeedTest: true\n",
};
export const WEB_SETTINGS = {
  container: true,
  hasPrivateKey: false,
  restartRequired: false,
  activeURL: "http://panel.test",
  config: {
    host: "0.0.0.0",
    port: 9443,
    mode: "http",
    domain: "",
    email: "",
    challengePort: 9080,
    certificate: "",
    publicURL: "http://panel.test",
    acceptedTerms: false,
  },
};
