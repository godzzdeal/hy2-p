import { type IDevices } from "@/services/users/devices/types";
import { type Page } from "@playwright/test";
import { mockPanel } from "../../fixtures";
export async function mockDevices(page: Page) {
  await mockPanel(page);
  let data: IDevices = {
    limit: 0,
    devices: [
      {
        id: "a".repeat(32),
        model: "iPhone fixture",
        os: "iOS",
        osVersion: "18",
        app: "Happ/4.12.0",
        firstSeen: "2026-11-06T10:00:00Z",
        lastSeen: "2026-11-06T11:00:00Z",
        subscriptionIp: "198.51.100.1",
        lastConnected: "2026-11-06T11:01:00Z",
        connectionIp: "203.0.113.4",
        core: "default",
        blocked: false,
        online: 1,
        statusAvailable: true,
      },
    ],
  };
  await page.route("**/api/users/test-user/devices**", async (route) => {
    const request = route.request();
    if (request.method() === "PUT")
      data = { ...data, limit: (request.postDataJSON() as { limit: number }).limit };
    if (request.method() === "PATCH")
      data = {
        ...data,
        devices: data.devices.map((device) => ({
          ...device,
          blocked: (request.postDataJSON() as { blocked: boolean }).blocked,
          online: (request.postDataJSON() as { blocked: boolean }).blocked ? 0 : 1,
        })),
      };
    if (request.method() === "DELETE") data = { ...data, devices: [] };
    await route.fulfill({ json: data });
  });
  await page.route("**/api/users/test-user/links", (route) =>
    route.fulfill({
      json: {
        uri: data.limit > 0 ? "" : "hysteria2://fixture@vpn.example.org:8443/",
        deviceLimit: data.limit,
        connections: [],
        subscription: "https://panel.test/sub/fixture",
      },
    }),
  );
  await page.getByRole("link", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await page.getByLabel("Имя", { exact: true }).fill("Phone");
  await page.getByRole("button", { name: "Сохранить пользователя", exact: true }).click();
  return {
    saved: () => data,
    set: (next: IDevices) => {
      data = next;
    },
  };
}
