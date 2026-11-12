import { expect, test } from "@playwright/test";
import { mockPanel } from "./index";
import { PANEL_METADATA } from "../../../fixtures/data";
import type { IInstance } from "@/services/instances/types";

test("Mimic checks the draft and installation commands stay within the card",async({page},info)=>{
 await mockPanel(page);
 let checked="";
 await page.route("**/api/tools/mimic",async route=>{
  if(route.request().method()==="POST") checked=route.request().postDataJSON().config;
  await route.fulfill({json:{ready:false,container:true,managed:false,instanceId:"",kernel:"6.8.0",interfaces:["eth0"],checks:[{id:"installation",ok:false,detail:"Включите режим установки Mimic"}]}});
 });
 await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 await page.getByRole("button",{name:"Mimic",exact:true}).click();
 const tools=page.getByRole("region",{name:"Проверка Mimic"});
 await expect(tools).toContainText("sudo hy2-panel mimic-setup --instance default");
 await page.getByRole("textbox",{name:"mimic.interface",exact:true}).fill("eth0");
 await tools.getByRole("button",{name:"Проверить",exact:true}).click();
 await expect.poll(()=>checked).toContain("interface: eth0");
 expect(await tools.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
 await tools.screenshot({path:info.outputPath("mimic.png")});
});

test("Mimic instance selection updates the setup command without losing the draft",async({page})=>{
 const panel=await mockPanel(page);
 const second="0123456789abcdef";
 const instances=PANEL_METADATA["/api/instances"] as IInstance[];
 await page.route("**/api/instances",route=>route.fulfill({json:[...instances,{...instances[0],id:second,name:"Mimic test"}]}));
 await page.route("**/api/instances/"+second+"/**",route=>route.fulfill({json:route.request().url().endsWith("/settings")?panel.saved():{ready:false,container:true,managed:false,instanceId:"",kernel:"6.8.0",interfaces:["eth0"],checks:[]}}));
 await page.reload();
 await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 await page.getByRole("button",{name:"Mimic",exact:true}).click();
 const tools=page.getByRole("region",{name:"Проверка Mimic"});
 await expect(tools.getByRole("list")).toBeHidden();
 await tools.getByRole("combobox",{name:"Экземпляр для Mimic",exact:true}).click();
 await page.getByRole("option",{name:"Mimic test",exact:true}).click();
 await expect(page.getByRole("region",{name:"Проверка Mimic"})).toContainText("sudo hy2-panel mimic-setup --instance "+second);
});
