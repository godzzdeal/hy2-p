import { expect, test } from "@playwright/test";
import { mockGroups } from "./fixture";
test("group editor saves per-member quotas and reopens the saved policy", async ({ page }, info) => {
  const fixture = await mockGroups(page);
  await page.getByRole("button", { name: "Группы", exact: true }).click();
  await page.getByRole("button", { name: "Создать группу", exact: true }).click();
  await page.getByLabel("Название группы", { exact: true }).fill("Friends");
  await page.getByLabel("Лимит трафика на участника, ГБ", { exact: true }).fill("2");
  await page.getByLabel("Лимит устройств на участника", { exact: true }).fill("3");
  await page.getByRole("combobox", { name: "Режим доступа к экземплярам", exact: true }).click();
  await page.getByRole("option", { name: "Только выбранные экземпляры", exact: true }).click();
  await page.getByRole("button", { name: "Сохранить группу", exact: true }).click();
  await expect.poll(() => fixture.saved().groups[0]?.trafficLimit).toBe(2 * 1024 ** 3);
  await expect.poll(() => fixture.saved().groups[0]?.access.instances).toEqual(["default"]);
  await page.getByRole("button", { name: /^Friends/ }).click();
  await expect(page.getByLabel("Лимит устройств на участника", { exact: true })).toHaveValue("3");
  await expect(page.getByLabel("Лимит трафика на участника, ГБ", { exact: true })).toHaveValue("2");
  await page
    .getByRole("dialog", { name: "Группы пользователей", exact: true })
    .screenshot({ path: info.outputPath("group-editor.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
