import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { mockPanel } from "./index";
import { dropFiles } from "../../uploads/drop";

test("ACL rows stay compact and edit rules in a separate form",async({page},info)=>{
 const panel=await mockPanel(page,true,{host:"vpn.example.org",port:"8443",sni:"vpn.example.org",authMode:"panel",config:"listen: :8443\nacl:\n  inline:\n    - direct(all)\n    - reject(suffix:example.com)\n"});
 await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 await page.getByRole("button",{name:"ACL",exact:true}).click();
 const row=page.getByRole("article",{name:"Правило ACL 1",exact:true});
 await expect(row).toBeVisible();
 expect((await row.boundingBox())!.height).toBeLessThanOrEqual(80);
 expect(await row.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
 await row.getByRole("button",{name:"Изменить правило 1",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"Изменить правило ACL",exact:true});
 await expect(dialog).toBeVisible();
 expect(await page.locator("form form").count()).toBe(0);
 await dialog.getByRole("button",{name:"Отменить",exact:true}).click();
 await row.getByRole("button",{name:"Действия правила 1",exact:true}).click();
 await expect(page.getByRole("menuitem",{name:"Переместить правило 1 выше",exact:true})).toBeDisabled();
 await page.getByRole("menuitem",{name:"Переместить правило 1 ниже",exact:true}).click();
 await expect(row).toContainText("reject(suffix:example.com)");
 await row.getByRole("button",{name:"Действия правила 1",exact:true}).click();
 await page.getByRole("menuitem",{name:"Удалить правило 1",exact:true}).click();
 await expect(page.getByRole("article",{name:/Правило ACL/})).toHaveCount(1);
 await expect(row).toContainText("direct(all)");
 await row.screenshot({path:info.outputPath("acl-compact-rule.png")});
 await page.getByRole("button",{name:"Сохранить конфигурацию",exact:true}).click();
 await expect.poll(()=>parse(panel.saved().config).acl?.inline).toEqual(["direct(all)"]);
});

test("ACL dialog edits the draft without submitting the configuration form", async ({page},info)=>{
 const panel=await mockPanel(page);
 await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 await page.getByRole("button",{name:"ACL",exact:true}).click();
 const editor=page.getByRole("region",{name:"Редактор правил ACL"});
 await editor.getByRole("button",{name:"Добавить",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"Новое правило ACL"});
 await expect(dialog).toBeVisible();
 expect(await page.locator("form form").count()).toBe(0);
 await dialog.getByRole("combobox",{name:"Тип адреса",exact:true}).click();
 await page.getByRole("option",{name:"Домен и поддомены",exact:true}).click();
 await dialog.getByRole("textbox",{name:"Адрес правила",exact:true}).fill("example.net");
 await dialog.getByRole("textbox",{name:"Порты",exact:true}).fill("0");
 await dialog.getByRole("button",{name:"Сохранить",exact:true}).click();
 await expect(dialog).toBeVisible();
 await dialog.getByRole("textbox",{name:"Порты",exact:true}).fill("443");
 await dialog.getByRole("button",{name:"Сохранить",exact:true}).click();
 await expect(dialog).toBeHidden();
 expect(panel.saved().config).not.toContain("example.net");
 await expect(editor).toContainText("direct(suffix:example.net, */443)");
 await expect(page.locator(".draft-bar")).toBeVisible();
 await page.getByRole("button",{name:"Сохранить конфигурацию",exact:true}).click();
 await expect.poll(()=>parse(panel.saved().config).acl?.inline).toEqual(["direct(suffix:example.net, */443)"]);
 expect(await editor.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
 await editor.screenshot({path:info.outputPath("acl-editor.png")});
});

test("finishing an ACL upload after changing sections preserves newer edits",async({page})=>{
 const panel=await mockPanel(page);
 let finish:(()=>void)|undefined;
 await page.route(/\/api\/tools\/acl-file\?kind=file/,async route=>{
  await new Promise<void>(resolve=>{finish=resolve});
  await route.fulfill({json:{path:"/data/acl-files/rules.txt"}});
 });
 await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 await page.getByRole("button",{name:"ACL",exact:true}).click();
 const rules=page.getByRole("region",{name:"acl.file",exact:true});
 await rules.getByRole("combobox").click();await page.getByRole("option",{name:"Загрузить файл",exact:true}).click();
 await dropFiles(rules.getByRole("button",{name:"Выбрать файл: acl.file",exact:true}),[{name:"rules.txt",type:"text/plain",text:"direct(all)"}]);
 await expect.poll(()=>Boolean(finish)).toBe(true);
 await page.getByRole("button",{name:"QUIC parameters",exact:true}).click();
 await page.getByRole("textbox",{name:"quic.maxIdleTimeout",exact:true}).fill("45s");
 finish?.();
 await expect(page.getByRole("status").filter({hasText:"Файл готов"}).first()).toBeVisible();
 await page.getByRole("button",{name:"Сохранить конфигурацию",exact:true}).click();
 await expect.poll(()=>parse(panel.saved().config).acl?.file).toBe("/data/acl-files/rules.txt");
 expect(parse(panel.saved().config).quic.maxIdleTimeout).toBe("45s");
});

test("ACL file upload and database URL set real file paths in the draft",async({page},info)=>{
 const panel=await mockPanel(page);
 let hasMultipart=false;let requestedURL="";
 await page.route(/\/api\/tools\/acl-file\?kind=/,async route=>{
  const kind=new URL(route.request().url()).searchParams.get("kind");
  if(kind==="file")hasMultipart=route.request().headers()["content-type"].startsWith("multipart/form-data")&&Boolean(route.request().postDataBuffer()?.includes(Buffer.from("direct(all)")));
  else requestedURL=route.request().postDataJSON().url;
  await route.fulfill({json:{path:"/data/acl-files/"+kind+(kind==="file"?".txt":".dat")}});
 });
 await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 await page.getByRole("button",{name:"ACL",exact:true}).click();
 const rules=page.getByRole("region",{name:"acl.file",exact:true});
 await rules.getByRole("combobox").click();await page.getByRole("option",{name:"Загрузить файл",exact:true}).click();
 await dropFiles(rules.getByRole("button",{name:"Выбрать файл: acl.file",exact:true}),[{name:"rules.txt",type:"text/plain",text:"direct(all)"}]);
 await expect(rules.getByRole("textbox",{name:"acl.file",exact:true})).toHaveValue("/data/acl-files/file.txt");
 expect(hasMultipart).toBe(true);
 const geo=page.getByRole("region",{name:"acl.geoip",exact:true});
 await geo.getByRole("combobox").click();await page.getByRole("option",{name:"Скачать по ссылке",exact:true}).click();
 await geo.getByRole("textbox",{name:"Ссылка acl.geoip",exact:true}).fill("https://example.com/geoip.dat");
 await geo.getByRole("button",{name:"Скачать",exact:true}).click();
 await expect(geo.getByRole("textbox",{name:"acl.geoip",exact:true})).toHaveValue("/data/acl-files/geoip.dat");
 expect(requestedURL).toBe("https://example.com/geoip.dat");
 expect(panel.saved().config).not.toContain("acl-files");
 expect(await geo.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
 if(info.project.name==="mobile")expect((await page.locator(".draft-bar").boundingBox())!.height).toBeLessThanOrEqual(100);
 await geo.screenshot({path:info.outputPath("acl-sources.png")});
 await page.screenshot({path:info.outputPath("acl-sources-page.png")});
});
