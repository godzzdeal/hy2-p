import { type IAnnouncement } from "@/features/admin/announcement/model";
import { type Page } from "@playwright/test";
import path from "node:path";
import { type IConfiguration } from "@/features/configuration/model";
const DIST = path.resolve(import.meta.dirname, "../../dist");
export async function mockPanel(page: Page, isAuthorized = true) {
  let settings: IConfiguration = {
    host: "vpn.example.org",
    port: "8443",
    sni: "vpn.example.org",
    authMode: "panel",
    config:
      "listen: :8443\ntls:\n  cert: /certs/server.crt\n  key: /certs/server.key\ncongestion:\n  type: bbr\n  bbrProfile: aggressive\nspeedTest: true\n",
  };
  let announcement: IAnnouncement = { enabled: false, text: "", updateInterval: 6, profileTitle: "" };
  let logs = "2026-11-06 INFO Сертификат обновлён ✓\n2026-11-06 ERROR ACME: проверка домена не пройдена\n";
  await page.route("http://panel.test/**", async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/api/")) {
      await route.fulfill({
        path: path.join(DIST, url.pathname === "/" ? "index.html" : path.basename(url.pathname)),
      });
      return;
    }
    let response: unknown = {};
    switch (url.pathname) {
      case "/api/session":
        response = { ok: isAuthorized };
        break;
      case "/api/login":
        isAuthorized = true;
        response = { ok: true };
        break;
      case "/api/users":
        response = [];
        break;
      case "/api/settings":
        if (route.request().method() === "PUT") settings = route.request().postDataJSON() as IConfiguration;
        response = settings;
        break;
      case "/api/deployment":
        response = {
          container: true,
          httpChallenge: false,
          udpPublicPort: settings.port,
          udpListenPort: settings.config.match(/^listen:.*:([0-9]+)/m)?.[1] ?? "443",
          publishedUdpPort: "8443",
          publishedUdpListenPort: "8443",
          udpRestartRequired: settings.port !== "8443" || !settings.config.startsWith("listen: :8443"),
          udpWarning: "",
        };
        break;
      case "/api/core":
        response = { available: true, running: true, binary: "hysteria", logs };
        break;
      case "/api/logs":
        logs = "";
        response = { logs };
        break;
      case "/api/core/versions":
        response = [];
        break;
      case "/api/core/update":
        response = {
          current: "v2.13.0",
          previous: "",
          busy: false,
          result: { phase: "idle", message: "", target: "", started: "" },
          rollbackAvailable: false,
        };
        break;
      case "/api/history":
        response = [];
        break;
      case "/api/traffic":
        response = { available: true, users: {}, updated: "" };
        break;
      case "/api/admin/account":
        response = { username: "admin" };
        break;
      case "/api/admin/announcement":
        if (route.request().method() === "PUT")
          announcement = route.request().postDataJSON() as IAnnouncement;
        response = announcement;
        break;
      case "/api/admin/web":
        response = {
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
        break;
    }
    await route.fulfill({ json: response });
  });
  await page.goto("http://panel.test");
  return { saved: () => settings, subscription: () => announcement };
}
