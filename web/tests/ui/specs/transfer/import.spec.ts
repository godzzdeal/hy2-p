import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
const rows = [
  {kind:"core",id:"default",name:"Основной",action:"skip",target:"default",reason:"Такая конфигурация уже существует"},
  {kind:"user",id:"phone",name:"🚀 Phone",action:"add",reason:""},
  {kind:"user",id:"same",name:"Existing",action:"skip",reason:"Совпадает пользователь, имя или данные подключения"},
];
test("transfer previews duplicates, imports users and keeps controls inside the card", async ({page},info) => {
 await mockPanel(page);
 let applied: unknown;
 await page.route("http://panel.test/api/admin/transfer/**", route => {
  if(route.request().url().endsWith("/apply")) { applied=route.request().postDataJSON(); return route.fulfill({json:{rows:rows.map(row => ({...row,action:row.action==="add"?"added":row.action})),fingerprint:"preview"}}); }
  return route.fulfill({json:{rows,fingerprint:"preview"}});
 });
 await page.getByRole("button",{name:"Настройки",exact:true}).click();
 const card=page.locator("section").filter({has:page.getByRole("heading",{name:"Импорт и экспорт",exact:true})});
 await card.getByLabel("Файл импорта HY2-P").setInputFiles({name:"hy2-p.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify({format:"hy2-p/1",users:[{name:"Phone"}]}))});
 await expect(card.getByText("Existing",{exact:true})).toBeVisible();
 await expect(card.getByRole("button",{name:"Добавить новые записи",exact:true})).toBeEnabled();
 const box=await card.boundingBox();
 for(const control of await card.locator("input,button,[role=combobox]").all()) {
  if(!await control.isVisible())continue;
  const bound=await control.boundingBox();
  expect(bound!.x).toBeGreaterThanOrEqual(box!.x+12);
  expect(bound!.x+bound!.width).toBeLessThanOrEqual(box!.x+box!.width-12);
 }
 await card.screenshot({path:info.outputPath("transfer-preview.png")});
 await card.getByRole("button",{name:"Добавить новые записи",exact:true}).click();
 await expect(page.locator(".notification")).toContainText("Импорт завершён. Существующие записи не изменены.");
 expect(applied).toMatchObject({fingerprint:"preview",bundle:{format:"hy2-p/1"}});
 await expect(card.getByRole("button",{name:"Добавить новые записи",exact:true})).toBeDisabled();
});
test("invalid JSON reports a dismissible notification without revealing file contents",async({page})=>{
 await mockPanel(page);
 await page.getByRole("button",{name:"Настройки",exact:true}).click();
 await page.getByLabel("Файл импорта HY2-P").setInputFiles({name:"broken.json",mimeType:"application/json",buffer:Buffer.from("not-json-secret-password")});
 await expect(page.getByRole("alert")).toContainText("Не удалось прочитать JSON-файл HY2-P");
 await expect(page.locator("body")).not.toContainText("not-json-secret-password");
 await page.getByRole("button",{name:"Закрыть уведомление",exact:true}).click();
 await expect(page.getByRole("alert")).toHaveCount(0);
});
