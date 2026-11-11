import { type IAnnouncement } from "@/services/admin/announcement";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { type IUser } from "@/services/users/user-types";
import { type Page } from "@playwright/test";
import { INITIAL_SETTINGS, PANEL_METADATA, WEB_SETTINGS } from "./data";
const FRONTEND = process.env.PLAYWRIGHT_FRONTEND_URL ?? "http://127.0.0.1:3000";
export async function mockPanel(page: Page, isAuthorized = true, initial: IConfiguration = INITIAL_SETTINGS) {
  let settings = { ...initial };
  const coreActions: string[] = [];
  let users: IUser[] = [];
  let announcement: IAnnouncement = { enabled: false, text: "", updateInterval: 6, profileTitle: "" };
  let published = { publicPort: "8443", listenPort: "8443" };
  let polls = 0;
  let operation: Record<string, unknown> | undefined;
  let logs = "2026-11-06 INFO Сертификат обновлён ✓\n2026-11-06 ERROR ACME: проверка домена не пройдена\n";
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    let response: unknown = PANEL_METADATA[url.pathname] ?? {};
    if (/^\/api\/core\/(start|stop|restart)$/.test(url.pathname)) {
      const action = url.pathname.split("/").at(-1) ?? "";
      coreActions.push(action);
      await route.fulfill({
        json: { available: true, running: action !== "stop", binary: "hysteria", logs },
      });
      return;
    }
    if (url.pathname.startsWith("/api/deployment/udp/status/")) {
      polls++;
      if (polls >= 2 && operation) {
        published = { publicPort: String(operation.publicPort), listenPort: String(operation.listenPort) };
        operation = {
          ...operation,
          busy: false,
          phase: "success",
          message: "UDP-порт применён.",
          udpChecked: true,
          coreChecked: true,
        };
      }
      await route.fulfill({ json: operation });
      return;
    }
    switch (url.pathname) {
      case "/api/session":
        await route.fulfill({
          status: isAuthorized ? 200 : 401,
          json: isAuthorized ? { ok: true } : { error: "Нужен вход" },
        });
        return;
      case "/api/login":
        isAuthorized = true;
        response = { ok: true };
        break;
      case "/api/users":
        if (route.request().method() === "POST") {
          const input = route.request().postDataJSON() as IUser;
          users = [...users, { ...input, id: "test-user", enabled: true, expires: "", created: "" }];
        }
        response = route.request().method() === "POST" ? users.at(-1) : users;
        break;
      case "/api/settings":
        if (route.request().method() === "PUT") settings = route.request().postDataJSON() as IConfiguration;
        response = settings;
        break;
      case "/api/users/test-user":
        users = users.map((user) => ({ ...user, ...(route.request().postDataJSON() as Partial<IUser>) }));
        response = users[0];
        break;
      case "/api/deployment/udp":
        operation = {
          ...route.request().postDataJSON(),
          id: "a".repeat(32),
          busy: true,
          phase: "applying",
          message: "Проверяем UDP",
          udpChecked: false,
          coreChecked: false,
        };
        isAuthorized = false;
        response = operation;
        break;
      case "/api/deployment":
        response = {
          container: true,
          httpChallenge: false,
          udpPublicPort: settings.port,
          udpListenPort: settings.config.match(/^listen:.*:([0-9]+)/m)?.[1] ?? "443",
          publishedUdpPort: published.publicPort,
          publishedUdpListenPort: published.listenPort,
          udpRestartRequired:
            settings.port !== published.publicPort ||
            !settings.config.startsWith("listen: :" + published.listenPort),
          udpWarning: "",
          agentAvailable: true,
          agentBusy: operation?.busy ?? false,
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
      case "/api/certificates/hysteria":
        response = { mode: "tls", automaticRenewal: false, certificates: [] };
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
        response = WEB_SETTINGS;
        break;
    }
    await route.fulfill({ json: response });
  });
  await page.goto(FRONTEND);
  await page.evaluate(() => document.fonts.ready);
  return { saved: () => settings, subscription: () => announcement, coreActions };
}
