import { expect, test } from "@playwright/test";
import { chooseUserAction } from "../../fixtures";
import { GROUP, GROUP_ID, mockGroups, USERS } from "./fixture";
test("membership filters users and deleting a group keeps its users", async ({ page }, info) => {
  const fixture = await mockGroups(page, { groups: [GROUP], memberships: {} });
  await page
    .getByRole("button", { name: "Изменить группу пользователя " + USERS[0].id, exact: true })
    .click();
  await page.getByRole("combobox", { name: "Группа", exact: true }).click();
  await page.getByRole("option", { name: GROUP.name, exact: true }).click();
  await page.getByRole("button", { name: "Сохранить группу", exact: true }).click();
  await expect.poll(() => fixture.saved().memberships[USERS[0].id]).toBe(GROUP_ID);
  await page.getByRole("combobox", { name: "Фильтр по группе", exact: true }).click();
  await page.getByRole("option", { name: GROUP.name, exact: true }).click();
  await expect(page.locator(".group-users tr")).toHaveCount(1);
  await expect(page.locator("tbody .country-flag")).toHaveAttribute("src", "/flags/nl.svg");
  await chooseUserAction(page, USERS[0].name, "Трафик");
  await expect(page.getByRole("dialog").locator("h2 .country-flag")).toHaveAttribute("src", "/flags/nl.svg");
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.getByRole("button", { name: "Группы", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Удалить группу Friends", exact: true }).click();
  await expect.poll(() => fixture.saved().groups.length).toBe(0);
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.getByRole("combobox", { name: "Фильтр по группе", exact: true }).click();
  await page.getByRole("option", { name: "Все группы", exact: true }).click();
  await expect(page.locator(".group-users tr")).toHaveCount(2);
  await page.screenshot({ path: info.outputPath("group-membership.png"), fullPage: true });
});
test("a failed membership change rolls back the optimistic badge", async ({ page }) => {
  await mockGroups(page, { groups: [GROUP], memberships: {} });
  await page.route(/\/api\/users\/[^/]+\/group$/, (route) =>
    route.fulfill({ status: 409, json: { error: "Сначала отключите лишние устройства пользователя" } }),
  );
  await page
    .getByRole("button", { name: "Изменить группу пользователя " + USERS[0].id, exact: true })
    .click();
  await page.getByRole("combobox", { name: "Группа", exact: true }).click();
  await page.getByRole("option", { name: GROUP.name, exact: true }).click();
  await page.getByRole("button", { name: "Сохранить группу", exact: true }).click();
  await expect(
    page.getByText("Сначала отключите лишние устройства пользователя", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Изменить группу пользователя " + USERS[0].id, exact: true }),
  ).toContainText("Без группы");
});
test("group hierarchy manages multiple members and collapses rows", async ({ page }, info) => {
  const fixture = await mockGroups(page, { groups: [GROUP], memberships: { [USERS[0].id]: GROUP_ID } });
  const filter = page.getByRole("combobox", { name: "Фильтр по группе", exact: true });
  const search = page.getByRole("searchbox", { name: "Поиск пользователей", exact: true });
  if (info.project.name === "desktop") {
    const first = await filter.boundingBox(),
      second = await search.boundingBox();
    expect(Math.abs(first!.y - second!.y)).toBeLessThanOrEqual(1);
    expect(first!.height).toBe(second!.height);
  }
  await page.getByRole("button", { name: "Участники группы Friends", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Участники группы Friends", exact: true });
  await dialog.getByRole("checkbox", { name: "Выбрать " + USERS[0].name, exact: true }).uncheck();
  await dialog.getByRole("checkbox", { name: "Выбрать " + USERS[1].name, exact: true }).check();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await dialog.getByRole("button", { name: "Сохранить участников", exact: true }).click();
  await expect.poll(() => fixture.saved().memberships).toEqual({ [USERS[1].id]: GROUP_ID });
  const toggle = page.locator(".user-group-toggle").filter({ hasText: "Friends" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: "Two", exact: true })).toBeHidden();
  await toggle.click();
  await expect(page.getByRole("button", { name: "Two", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("user-hierarchy.png"), fullPage: true });
});
