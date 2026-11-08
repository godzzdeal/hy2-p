import { expect, test } from "@playwright/test";
import { chooseTheme } from "../../../fixtures/ui-actions";
import { GROUP, GROUP_ID, USERS, mockGroups } from "../fixture";
import { mockMembers } from ".";
test("expanding groups does not introduce a desktop scrollbar", async ({ page }, info) => {
  await mockGroups(page, { groups: [GROUP], memberships: Object.fromEntries(USERS.map(user => [user.id, GROUP_ID])) });
  if (info.project.name === "mobile") return;
  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    const wrap = page.locator(".table-wrap");
    for (const isExpanded of [true, false, true]) {
      const toggle = page.locator(".user-group-toggle");
      if (await toggle.getAttribute("aria-expanded") !== String(isExpanded)) await toggle.click();
      await expect.poll(() => wrap.evaluate(element => element.scrollWidth - element.clientWidth)).toBe(0);
      expect(await wrap.evaluate(element => element.scrollHeight - element.clientHeight)).toBe(0);
    }
  }
  await page.screenshot({ path: info.outputPath("groups-no-scrollbar.png"), fullPage: true });
});
test("member rows keep names, flags and group labels inside their bounds", async ({ page }, info) => {
  await mockMembers(page);
  for (const theme of [{ label: "Светлая", value: "light" }, { label: "Тёмная", value: "dark" }]) {
    await chooseTheme(page, theme);
    await page.getByRole("button", { name: "Участники группы Friends", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator(".group-member-row")).toHaveCount(9);
    const rows = await dialog.locator(".group-member-row").evaluateAll(elements => elements.map(element => {
      const row = element.getBoundingClientRect();
      const name = element.querySelector(".group-member-name")!.getBoundingClientRect();
      const group = element.querySelector(".group-member-group")!.getBoundingClientRect();
      const checkbox = element.querySelector("input")!.getBoundingClientRect();
      return { top: row.top, bottom: row.bottom, height: row.height, nameTop: name.top, nameBottom: name.bottom, groupTop: group.top, groupBottom: group.bottom, offset: Math.abs(checkbox.top + checkbox.height / 2 - row.top - row.height / 2) };
    }));
    for (const [index, row] of rows.entries()) {
      expect(row.height).toBeGreaterThanOrEqual(64);
      expect(row.nameTop).toBeGreaterThanOrEqual(row.top + 7);
      expect(row.groupTop).toBeGreaterThanOrEqual(row.nameBottom);
      expect(row.groupBottom).toBeLessThanOrEqual(row.bottom - 7);
      expect(row.offset).toBeLessThanOrEqual(1);
      if (index > 0) expect(row.top - rows[index - 1].bottom).toBeGreaterThanOrEqual(4);
    }
    expect(await dialog.evaluate(element => element.scrollWidth - element.clientWidth)).toBe(0);
    expect(await dialog.evaluate(element => element.scrollHeight - element.clientHeight)).toBe(0);
    const dialogBounds = await dialog.boundingBox();
    const saveBounds = await dialog.getByRole("button", { name: "Сохранить участников", exact: true }).boundingBox();
    expect(saveBounds!.y + saveBounds!.height).toBeLessThanOrEqual(dialogBounds!.y + dialogBounds!.height - 16);
    const list = dialog.locator(".group-member-list");
    expect(await list.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await dialog.screenshot({ path: info.outputPath("members-" + theme.value + ".png") });
    await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  }
});
