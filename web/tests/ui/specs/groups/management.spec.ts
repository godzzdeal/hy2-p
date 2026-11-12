import { expect, test } from "@playwright/test";
import { mockGroups } from "./fixture";
import { chooseUserAction, mockPanel } from "../../fixtures";

test("traffic fields allow clearing zero and preserve counters when only the quota changes",async({page})=>{
 await mockPanel(page);
 let saved:Record<string,number>={};
 await page.route("**/api/users/test-user/traffic",async route=>{
  saved=route.request().postDataJSON();
  await route.fulfill({json:{upload:0,download:0,limit:saved.limit,online:0,lastSeen:""}});
 });
 await page.getByRole("link",{name:"Пользователи",exact:true}).click();
 await page.getByRole("button",{name:"Добавить",exact:true}).click();
 await page.getByLabel("Имя",{exact:true}).fill("Phone");
 await page.getByRole("button",{name:"Сохранить пользователя",exact:true}).click();
 await chooseUserAction(page,"Phone","Трафик");
 const dialog=page.getByRole("dialog",{name:"Трафик: Phone",exact:true});
 const limit=dialog.getByRole("spinbutton",{name:"Лимит трафика (0 без ограничений)",exact:true});
 await expect(limit).toHaveValue("0");
 await limit.focus();await limit.press("End");await limit.pressSequentially("20");
 await expect(limit).toHaveValue("20");
 await limit.fill("");await expect(limit).toHaveValue("");
 await limit.pressSequentially("0.5");await expect(limit).toHaveValue("0.5");
 await dialog.getByRole("combobox",{name:"Единица измерения",exact:true}).click();
 await page.getByRole("option",{name:"МБ",exact:true}).click();
 await expect(limit).toHaveValue("512");
 await dialog.getByRole("button",{name:"Сохранить трафик",exact:true}).click();
 await expect(dialog).toBeHidden();
 expect(saved).toEqual({limit:512*1024**2});
});
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
