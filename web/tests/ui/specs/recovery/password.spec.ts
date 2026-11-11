import {expect,test} from "@playwright/test";
import { expandSettings, mockPanel } from "../../fixtures";

test("required validation names the missing field without sending a request",async({page})=>{
 await mockPanel(page,false);let calls=0;
 await page.route("**/api/login",route=>{calls++;return route.fulfill({json:{ok:true}})});
 const login=page.getByLabel("Логин",{exact:true});
 await login.clear();await login.press("Enter");
 await expect(page.locator(".notifications")).toContainText("Заполните поле «Логин».");
 await login.fill("admin");await page.getByLabel("Пароль",{exact:true}).press("Enter");
 await expect(page.locator(".notifications")).toContainText("Заполните поле «Пароль».");
 expect(calls).toBe(0);
});
test("forgotten password help is available before login and copies a server-only command",async({page},info)=>{
 await mockPanel(page,false);
 let loginCalls=0;
 await page.route("**/api/login",route=>{loginCalls++;return route.fulfill({json:{ok:true}})});
 await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async(value:string)=>{document.documentElement.dataset.copiedCommand=value}}}));
 const summary=page.getByText("Забыли пароль?",{exact:true});
 await summary.focus(); await summary.press("Enter");
 const form=page.locator(".login form");
 const block=form.getByRole("group",{name:"Команда для сервера"});
 await expect(block).toContainText("sudo hy2-panel password-reset");
 await block.getByRole("button",{name:"Скопировать команду",exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.dataset.copiedCommand)).toBe("sudo hy2-panel password-reset");
 expect(loginCalls).toBe(0);
 await expect(page.getByLabel("Пароль",{exact:true})).toHaveValue("");
 await expect(form).not.toContainText("Логин и облачный пароль сохранятся");
 const bounds=await form.boundingBox();
 const command=await block.boundingBox();
 expect(command!.x).toBeGreaterThanOrEqual(bounds!.x+16);
 expect(command!.x+command!.width).toBeLessThanOrEqual(bounds!.x+bounds!.width-16);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
 await page.screenshot({path:info.outputPath("password-recovery.png"),fullPage:true});
});
test("account settings show the same recovery instruction",async({page})=>{
 await mockPanel(page);
 await page.getByRole("link", { name: "Настройки",exact:true}).click();
  await expandSettings(page);
 const account=page.locator("#panel-account");
 await account.getByText("Забыли пароль?",{exact:true}).click();
 await expect(account.getByRole("group",{name:"Команда для сервера"})).toContainText("sudo hy2-panel password-reset");
});

test("account changes require valid new credentials and ignore unchanged submissions",async({page})=>{
 await mockPanel(page);
 let saves=0;
 await page.route("**/api/admin/account",route=>{
  if(route.request().method()!=="PUT")return route.fallback();
  saves++;return route.fulfill({json:{username:"admin",loginRequired:true}});
 });
 await page.getByRole("link",{name:"Настройки",exact:true}).click();
 await expandSettings(page);
 const account=page.locator("#panel-account");
 const submit=account.getByRole("button",{name:"Изменить данные входа",exact:true});
 const login=account.getByLabel("Логин",{exact:true});
 const current=account.getByLabel("Текущий пароль",{exact:true});
 const password=account.getByLabel("Новый пароль (не менее 16 символов)",{exact:true});
 await expect(submit).toBeDisabled();
 await current.fill("current-test-password");
 await expect(submit).toBeDisabled();
 await current.press("Enter");expect(saves).toBe(0);
 await login.fill("owner");await expect(submit).toBeEnabled();
 await login.fill("admin");await expect(submit).toBeDisabled();
 await password.fill("short");await expect(submit).toBeDisabled();
 await password.fill("current-test-password");await expect(submit).toBeDisabled();
 await password.fill("new-valid-test-password");await expect(submit).toBeEnabled();
 await current.clear();await expect(submit).toBeDisabled();
 await current.fill("current-test-password");await submit.click();
 await expect.poll(()=>saves).toBe(1);
});
