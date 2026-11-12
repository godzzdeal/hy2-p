import { expect, test } from "@playwright/test";
import { mockPanel, chooseTheme } from "../fixture";
import { selectSection } from ".";

test("configuration keeps its height and warnings share padding and distinct colors",async({page},info)=>{
 await mockPanel(page);await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 const editor=page.locator("#config-fields");
 await expect(editor).toBeVisible();
 await page.locator(".content").evaluate(content=>{
  content.scrollTop+=content.querySelector("#config-fields")!.getBoundingClientRect().top-content.getBoundingClientRect().top;
 });
 const height=(await editor.boundingBox())!.height;
 for(const theme of [{label:"Светлая",value:"light"},{label:"Тёмная",value:"dark"}]) {
  await chooseTheme(page,theme);
  await selectSection(page,"TLS / ACME");
  const body=page.locator(".configuration-section-body");
  const warning=body.locator('.notice[data-variant="warning"]').first();
  await expect(warning).toContainText("Сертификаты пока не найдены");
  const padding=await warning.evaluate(element=>{
   const body=element.closest(".configuration-section-body")!.getBoundingClientRect();const box=element.getBoundingClientRect();
   return {left:box.left-body.left,top:box.top-body.top,right:body.right-box.right};
  });
  expect(padding).toEqual({left:16,top:16,right:16});
  const warningColor=await warning.evaluate(element=>getComputedStyle(element).backgroundColor);
  expect((await warning.boundingBox())!.y).toBeLessThan((await page.getByLabel("Сертификат Hysteria2",{exact:true}).boundingBox())!.y);
  await page.locator(".configuration-fields").screenshot({path:info.outputPath("tls-warning-"+theme.value+".png")});
  for(const section of ["ECH","Traffic Stats API","Realm","QUIC parameters","Mimic","ACL","Listen","TLS / ACME"]) {
   await selectSection(page,section);expect((await editor.boundingBox())!.height).toBe(height);
   const excess=await page.locator(".content").evaluate(content=>{
    const pageContent=content.querySelector<HTMLElement>(".page-content")!;
    return content.scrollHeight-Math.max(content.clientHeight,pageContent.offsetTop+pageContent.offsetHeight);
   });
   expect(excess).toBeLessThanOrEqual(1);
   expect(await body.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
   if(section==="ECH") {
    const notice=body.locator('.notice[data-variant="info"]').first();
    expect(await notice.evaluate(element=>getComputedStyle(element).backgroundColor)).not.toBe(warningColor);
    expect(await notice.evaluate(element=>element.getBoundingClientRect().left-element.closest(".configuration-section-body")!.getBoundingClientRect().left)).toBe(16);
   }
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test("property action buttons have no empty reset slot",async({page})=>{
 await mockPanel(page);await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 await selectSection(page,"TLS / ACME");
 const fields=page.locator(".config-field");
 const empty=fields.filter({has:page.locator("label").filter({hasText:"tls.clientCA"})});
 await expect(empty.locator(".field-reset")).toBeHidden();
 const help=(await empty.getByRole("button",{name:"Информация о поле tls.clientCA",exact:true}).boundingBox())!;
 const header=(await empty.locator(".config-property").boundingBox())!;
 expect(Math.abs(header.x+header.width-help.x-help.width)).toBeLessThanOrEqual(1);
 const configured=fields.filter({has:page.locator("label").filter({hasText:"tls.cert"})});
 const info=(await configured.getByRole("button",{name:"Информация о поле tls.cert",exact:true}).boundingBox())!;
 const reset=(await configured.getByRole("button",{name:"Сбросить tls.cert",exact:true}).boundingBox())!;
 expect(reset.x-info.x-info.width).toBe(4);
 expect(reset.y).toBe(info.y);expect(reset.height).toBe(info.height);
});
