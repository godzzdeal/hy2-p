import { expect,test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("YAML file import updates only the draft until explicitly saved",async({page})=>{
 const {coreActions}=await mockPanel(page);
 await page.getByRole("button",{name:"Конфигурация",exact:true}).click();
 let saves=0;
 await page.route("http://panel.test/api/settings",async(route)=>{ if(route.request().method()==="PUT")saves++; await route.fallback(); });
 await page.getByLabel("Импорт YAML в черновик",{exact:true}).setInputFiles({name:"config.yaml",mimeType:"application/yaml",buffer:Buffer.from("listen: :62000\ntls:\n  cert: /certs/server.crt\n  key: /certs/server.key\nauth:\n  type: password\n  password: fixture-password-1234\n")});
 await expect(page.locator(".notification")).toContainText("YAML загружен в черновик");
 await expect(page.getByLabel("Публичный UDP-порт",{exact:true})).toHaveValue("62000");
 expect(saves).toBe(0);
 expect(coreActions).toEqual([]);
 await page.getByRole("button",{name:"Сохранить конфигурацию",exact:true}).click();
 await expect.poll(()=>saves).toBe(1);
 expect(coreActions).toEqual([]);
});
test("invalid YAML file keeps the previous draft and reports a notification",async({page})=>{
 await mockPanel(page);
 await page.getByRole("button",{name:"Конфигурация",exact:true}).click();
 await page.getByLabel("Импорт YAML в черновик",{exact:true}).setInputFiles({name:"bad.yaml",mimeType:"application/yaml",buffer:Buffer.from("tls: {}\n---\ntls: {}")});
 await expect(page.getByRole("alert")).toContainText("Некорректный YAML");
 await expect(page.getByLabel("Публичный UDP-порт",{exact:true})).toHaveValue("8443");
});
