import { type IConfiguration } from "@/services/configuration/configuration-types";
import { type IInstance } from "@/services/instances/types";
import { type Page } from "@playwright/test";
import { mockPanel } from "../../fixtures";
import { INITIAL_SETTINGS } from "../../fixtures/data";
export const EXTRA_ID = "a".repeat(16);
export async function mockInstances(page: Page, withExtra = false) {
  const panel = await mockPanel(page);
  let extra: IConfiguration = {
    ...INITIAL_SETTINGS,
    host: "second.example.org",
    port: "8444",
    config: INITIAL_SETTINGS.config.replaceAll("8443", "8444"),
  };
  let instances: IInstance[] = [
    {
      id: "default",
      name: "Основной",
      slot: 0,
      running: true,
      updating: false,
      version: "v2.13.0",
      host: INITIAL_SETTINGS.host,
      port: "8443",
      publishedPort: "8443",
      listenPort: "8443",
      portChangeRequired: false,
      authMode: "panel",
    },
  ];
  const second: IInstance = {
    ...instances[0]!,
    id: EXTRA_ID,
    name: "Второй",
    slot: 1,
    host: extra.host,
    port: "8444",
    publishedPort: "8444",
    listenPort: "8444",
    running: false,
  };
  if (withExtra) instances.push({ ...second });
  const requests: string[] = [];
  await page.route("**/api/instances**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method();
    const endpoint = url.pathname.slice(("/api/instances/" + EXTRA_ID).length);
    requests.push(method + " " + url.pathname);
    let response: unknown = {};
    if (url.pathname === "/api/instances") {
      if (method === "POST") {
        const input = request.postDataJSON() as { name: string; settings: IConfiguration };
        extra = input.settings;
        instances.push({ ...second, name: input.name, host: extra.host, port: extra.port });
        response = { id: EXTRA_ID };
      } else response = instances;
    } else if (endpoint === "") {
      if (method === "PATCH")
        instances = instances.map((item) =>
          item.id === EXTRA_ID ? { ...item, name: (request.postDataJSON() as { name: string }).name } : item,
        );
      if (method === "DELETE") instances = instances.filter((item) => item.id !== EXTRA_ID);
      response = { removed: true, operation: null };
    } else if (endpoint === "/settings") {
      if (method === "PUT") extra = request.postDataJSON() as IConfiguration;
      response = extra;
    } else if (endpoint === "/history") response = [];
    else if (endpoint === "/deployment") response = { container: false };
    else if (endpoint === "/certificates/hysteria")
      response = { mode: "tls", automaticRenewal: false, certificates: [] };
    else if (endpoint === "/core/update")
      response = {
        current: "v2.12.0",
        previous: "",
        busy: false,
        result: { phase: "idle", message: "", target: "", started: "" },
        rollbackAvailable: false,
      };
    else if (endpoint.startsWith("/core")) {
      const action = endpoint.split("/").at(-1);
      if (method === "POST")
        instances = instances.map((item) =>
          item.id === EXTRA_ID ? { ...item, running: action !== "stop" } : item,
        );
      response = {
        running: instances.find((item) => item.id === EXTRA_ID)?.running,
        available: true,
        binary: "hysteria",
        logs: "SECOND ENGINE LOG",
      };
    } else if (endpoint === "/logs") response = { logs: "" };
    await route.fulfill({ json: response });
  });
  await page.reload();
  return { panel, requests, extra: () => extra };
}
