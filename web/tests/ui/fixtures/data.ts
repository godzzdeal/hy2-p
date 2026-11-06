import { type IConfiguration } from "@/features/configuration/model";
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
