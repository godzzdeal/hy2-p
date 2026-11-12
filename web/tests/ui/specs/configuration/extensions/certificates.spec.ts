import { expect, test } from "@playwright/test";
import { mockPanel } from "./index";

test("certificate deletion confirms, rolls back failures and protects active files",async({page},info)=>{
 await mockPanel(page);
 let shouldFail=true;
 let isRemoved=false;
 await page.route("**/api/certificates/hysteria",async route=>{
  if(route.request().method()==="DELETE") {
   if(shouldFail){shouldFail=false;await route.fulfill({status:409,json:{error:"Сначала остановите экземпляры, использующие этот сертификат"}});return;}
   isRemoved=true;await route.fulfill({json:{ok:true}});return;
  }
  await route.fulfill({json:{mode:"tls",automaticRenewal:false,certificates:[
   {id:"active",path:"/data/certificates/active.crt",domains:["vpn.example.org"],notAfter:"2027-01-01",expired:false,inUse:true,canDelete:false},
   ...isRemoved?[]:[{id:"old",path:"/data/certificates/old.crt",domains:["old.example.org"],notAfter:"2027-01-01",expired:false,canDelete:true}],
  ]}});
 });
 await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 await page.getByRole("button",{name:"TLS / ACME",exact:true}).click();
 await expect(page.getByRole("button",{name:"Удалить сертификат vpn.example.org",exact:true})).toBeDisabled();
 for(let attempt=0;attempt<2;attempt++){
  await page.getByRole("button",{name:"Удалить сертификат old.example.org",exact:true}).click();
  await page.getByRole("dialog",{name:"Удалить сертификат?"}).getByRole("button",{name:"Удалить",exact:true}).click();
  if(attempt===0) await expect(page.getByRole("button",{name:"Удалить сертификат old.example.org",exact:true})).toBeVisible();
 }
 await expect(page.getByRole("button",{name:"Удалить сертификат old.example.org",exact:true})).toHaveCount(0);
 await page.locator(".certificate-status").screenshot({path:info.outputPath("certificates.png")});
});
