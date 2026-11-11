import { type IGroup, type IGroupInput, type IGroups } from "@/services/groups/types";
import { type Page } from "@playwright/test";
import { mockPanel } from "../../fixtures";
export const GROUP_ID = "cccccccccccccccc";
export const USERS = [
  { id: "aaaaaaaaaaaaaaaa", name: "🇳🇱 One", enabled: true, expires: "", created: "" },
  { id: "bbbbbbbbbbbbbbbb", name: "Two", enabled: true, expires: "", created: "" },
];
export const GROUP: IGroup = {
  id: GROUP_ID,
  name: "Friends",
  color: "cyan",
  access: { mode: "all", instances: [] },
  trafficLimit: 0,
  deviceLimit: 0,
};
export async function mockGroups(page: Page, initial: IGroups = { groups: [], memberships: {} }) {
  await mockPanel(page);
  let state = structuredClone(initial);
  await page.route("**/api/users", (route) => route.fulfill({ json: USERS }));
  await page.route("**/api/groups**", async (route) => {
    const request = route.request();
    const id = new URL(request.url()).pathname.split("/").at(-1) ?? "";
    if (id === "members" && request.method() === "PUT") {
      const groupId = new URL(request.url()).pathname.split("/").at(-2) ?? "";
      const input = request.postDataJSON() as { userIds: string[] };
      state.memberships = Object.fromEntries(
        Object.entries(state.memberships).filter(([_user, group]) => group !== groupId),
      );
      for (const user of input.userIds) state.memberships[user] = groupId;
      await route.fulfill({ json: state });
      return;
    }
    if (request.method() === "POST" || request.method() === "PUT") {
      const group = {
        ...(request.postDataJSON() as IGroupInput),
        id: request.method() === "POST" ? GROUP_ID : id,
      };
      state.groups = [...state.groups.filter((item) => item.id !== group.id), group];
    }
    if (request.method() === "DELETE") {
      state.groups = state.groups.filter((group) => group.id !== id);
      state.memberships = Object.fromEntries(
        Object.entries(state.memberships).filter(([_user, group]) => group !== id),
      );
    }
    await route.fulfill({ json: state });
  });
  await page.route(/\/api\/users\/[^/]+\/group$/, async (route) => {
    const id = new URL(route.request().url()).pathname.split("/").at(-2) ?? "";
    const { groupId } = route.request().postDataJSON() as { groupId: string };
    if (groupId) state.memberships[id] = groupId;
    else delete state.memberships[id];
    await route.fulfill({ json: state });
  });
  await page.getByRole("link", { name: "Пользователи", exact: true }).click();
  await page.getByRole("button", { name: "Обновить", exact: true }).click();
  return { saved: () => state };
}
