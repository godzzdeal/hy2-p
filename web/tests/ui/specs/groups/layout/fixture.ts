import { type Page } from "@playwright/test";
import { GROUP, GROUP_ID, mockGroups } from "../fixture";
export const MEMBER_NAMES = ["🇳🇱 🐈 kapibara2-pc", "🇳🇱 🦒 kapibara2", "🇳🇱 🦉 kapibara1", "🇳🇱 🦄 maru", "🇳🇱 🐲 ssi777", "🇳🇱 🐰 irl", "🇳🇱 🖥️ godzz-pc", "🇳🇱 💜 latecline", "🇩🇪 🚀 Очень длинное имя пользователя для проверки переноса текста на маленьком экране"];
export async function mockMembers(page: Page) {
  await mockGroups(page, { groups: [GROUP], memberships: { [String(0).padStart(16, "a")]: GROUP_ID } });
  const users = MEMBER_NAMES.map((name, index) => ({ id: String(index).padStart(16, "a"), name, enabled: true, expires: "", created: "" }));
  await page.route("**/api/users", route => route.fulfill({ json: users }));
  await page.getByRole("button", { name: "Обновить", exact: true }).click();
  return { users, groupId: GROUP_ID };
}
