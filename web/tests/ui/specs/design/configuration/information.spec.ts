import { expect, test } from "@playwright/test";
import { chooseTheme, expectInside, mockPanel } from "../fixture";

test("panel-managed authentication blocks selects and native mode unlocks them",async({page})=>{
 const panel=await mockPanel(page);
 await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 await page.getByRole("button",{name:"Authentication",exact:true}).click();
 for(const path of ["auth.type","auth.http.insecure"]) {
  const control=page.getByRole("combobox",{name:path,exact:true});
  await expect(control).toBeDisabled();
  await control.click({force:true});
  await control.dispatchEvent("keydown",{key:"Enter"});
  await expect(page.getByRole("listbox")).toHaveCount(0);
 }
 await page.getByLabel("Кто управляет доступом",{exact:true}).click();
 await page.getByRole("option",{name:"Настройки Hysteria2",exact:true}).click();
 const type=page.getByRole("combobox",{name:"auth.type",exact:true});
 await expect(type).toBeEnabled();
 await type.click();await page.getByRole("option",{name:"http",exact:true}).click();
 const insecure=page.getByRole("combobox",{name:"auth.http.insecure",exact:true});
 await expect(insecure).toBeEnabled();
 await insecure.click();await page.getByRole("option",{name:"true",exact:true}).click();
 await page.getByRole("button",{name:"Сохранить конфигурацию",exact:true}).click();
 await expect.poll(()=>panel.saved().authMode).toBe("native");
 expect(panel.saved().config).toContain("insecure: true");
});

test("field information opens with keyboard or touch without submitting or moving controls",async({page},info)=>{
 await mockPanel(page);let saves=0;
 await page.route("**/api/settings",route=>{if(route.request().method()==="PUT")saves++;return route.fallback()});
 await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 const trigger=page.getByRole("button",{name:"Информация о поле listen",exact:true});
 const popup=page.getByRole("dialog",{name:"Информация о поле listen",exact:true});
 await expect(page.getByRole("checkbox",{name:"Показывать пояснения",exact:true})).toHaveCount(0);
 for(const theme of [{label:"Светлая",value:"light"},{label:"Тёмная",value:"dark"}]) {
  await chooseTheme(page,theme);await trigger.scrollIntoViewIfNeeded();
  const input=page.getByLabel("listen",{exact:true});const before=(await input.boundingBox())!;
  await trigger.focus();await trigger.press("Enter");await expect(popup).toBeVisible();
  await expect(popup).toContainText("UDP-порт экземпляра внутри контейнера");
  await expect(popup).toContainText("По умолчанию: :443");
  expect((await input.boundingBox())!.y).toBe(before.y);
  const bounds=(await popup.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await popup.evaluate(element=>Promise.all(element.getAnimations().map(animation=>animation.finished)));
  await popup.screenshot({path:info.outputPath("field-info-"+theme.value+".png")});
  await page.keyboard.press("Escape");await expect(popup).toHaveCount(0);await expect(trigger).toBeFocused();
  await trigger.click();await popup.getByRole("button",{name:"Закрыть подсказку",exact:true}).click();
  await expect(popup).toHaveCount(0);expect(saves).toBe(0);
 }
 await page.getByRole("searchbox",{name:"Найти свойство",exact:true}).fill("trafficStats.secret");
 await expect(page.getByLabel("trafficStats.secret",{exact:true})).toBeDisabled();
 await page.getByRole("button",{name:"Информация о поле trafficStats.secret",exact:true}).click();
 await expect(page.getByRole("dialog",{name:"Информация о поле trafficStats.secret",exact:true})).toBeVisible();
});

test("connection field information keeps labels and inputs aligned",async({page},info)=>{
 await mockPanel(page);await page.getByRole("link",{name:"Конфигурация",exact:true}).click();
 const host=page.getByLabel("Публичный адрес",{exact:true});const port=page.getByLabel("Публичный UDP-порт",{exact:true});
 const sni=page.getByLabel("SNI",{exact:true});
 if(info.project.name==="desktop") {
  expect((await host.boundingBox())!.y).toBe((await port.boundingBox())!.y);
  expect((await host.boundingBox())!.y).toBe((await sni.boundingBox())!.y);
 }
 for(const label of ["Публичный адрес","Публичный UDP-порт","SNI","pinSHA256"]) {
  await page.getByRole("button",{name:"Информация о поле "+label,exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Информация о поле "+label,exact:true});
  await expect(dialog).toBeVisible();await expectInside(dialog);
  await dialog.getByRole("button",{name:"Закрыть подсказку",exact:true}).click();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
