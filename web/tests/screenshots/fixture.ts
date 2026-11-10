import { type Page } from "@playwright/test";
import { mockGroups } from "../ui/specs/groups/fixture";

export async function prepareScreenshots(page: Page, version: string): Promise<void> {
  const family = {
    id: "a".repeat(16),
    name: "Семья",
    color: "purple" as const,
    access: { mode: "all" as const, instances: [] },
    trafficLimit: 0,
    deviceLimit: 0,
  };
  const work = { ...family, id: "b".repeat(16), name: "Команда", color: "cyan" as const };
  const users = ["🇳🇱 Телефон", "🇩🇪 Ноутбук", "🇩🇪 Рабочий ПК", "🇳🇱 Планшет"].map((name, index) => ({
    id: "9e62af500000000" + index,
    name,
    enabled: index !== 3,
    created: "2026-11-10T09:00:00Z",
    expires: "",
  }));
  await mockGroups(page, {
    groups: [family, work],
    memberships: Object.fromEntries(users.map((user, index) => [user.id, index < 2 ? family.id : work.id])),
  });
  await page.route("http://panel.test/api/users", (route) => route.fulfill({ json: users }));
  await page.route("http://panel.test/api/traffic", (route) =>
    route.fulfill({
      json: {
        available: true,
        updated: "2026-11-10T09:00:00Z",
        users: Object.fromEntries(
          users.map((user, index) => [
            user.id,
            {
              upload: (index + 1) * 128 * 1024 ** 2,
              download: (index + 1) * 0.75 * 1024 ** 3,
              limit: 20 * 1024 ** 3,
              online: index < 2 ? 1 : 0,
              lastSeen: "2026-11-10T09:00:00Z",
            },
          ]),
        ),
      },
    }),
  );
  await page.route("http://panel.test/api/core", (route) =>
    route.fulfill({ json: { running: true, available: true, logs: "", binary: "/usr/local/bin/hysteria" } }),
  );
  await page.route("http://panel.test/api/version", (route) =>
    route.fulfill({ json: { version, revision: "preview" } }),
  );
  await page.route("http://panel.test/api/panel/update", (route) =>
    route.fulfill({
      json: {
        current: version,
        latest: version,
        state: "current",
        url: "https://github.com/godzzdeal/hy2-p/releases/latest",
      },
    }),
  );
}
