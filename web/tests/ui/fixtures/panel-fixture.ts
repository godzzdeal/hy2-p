import { type IUser } from "@/features/users/model";
import { type IAnnouncement } from "@/features/admin/announcement/model";
import { type Page } from "@playwright/test";
import path from "node:path";
import { type IConfiguration } from "@/features/configuration/model";
import { INITIAL_SETTINGS, WEB_SETTINGS } from "./data";
const DIST = path.resolve(process.cwd(), "dist");
export async function mockPanel(page: Page, isAuthorized = true) {
  let settings = { ...INITIAL_SETTINGS };
  const coreActions: string[] = [];
  let users: IUser[] = [];
  let announcement: IAnnouncement = { enabled: false, text: "", updateInterval: 6, profileTitle: "" };
  let published = { publicPort: "8443", listenPort: "8443" };
  let polls = 0;
  let operation: Record<string, unknown> | undefined;
  let logs = "2026-11-06 INFO Сертификат обновлён ✓\n2026-11-06 ERROR ACME: проверка домена не пройдена\n";
  await page.route("http://panel.test/**", async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/api/")) {
      await route.fulfill({
        path: path.join(DIST, url.pathname === "/" ? "index.html" : url.pathname.slice(1)),
      });
      return;
    }
    let response: unknown = {};
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
      case "/api/version":
        response = { version: "v0.2.1", revision: "test-build" };
        break;
      case "/api/session":
        response = { ok: isAuthorized };
        break;
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
  await page.goto("http://panel.test");
  await page.evaluate(() => document.fonts.ready);
  return { saved: () => settings, subscription: () => announcement, coreActions };
}
