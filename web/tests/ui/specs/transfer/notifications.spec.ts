import { expect, test } from "@playwright/test";
import { mockPanel } from "../../fixtures";
test("stopped core can apply Docker ports and failures use compact notifications",async({page})=>{
 await mockPanel(page);
 await page.route("http://panel.test/api/core",route=>route.fulfill({json:{available:true,running:false,logs:""}}));
 await page.route("http://panel.test/api/deployment/udp/status/**",route=>route.fulfill({json:{id:"a".repeat(32),busy:false,phase:"rolled_back",message:"Проверка не прошла. Прежние UDP-порты восстановлены."}}));
 await page.getByRole("button",{name:"Конфигурация",exact:true}).click();
 await page.getByLabel("Публичный UDP-порт",{exact:true}).fill("61254");
 await page.getByRole("button",{name:"Сохранить конфигурацию",exact:true}).click();
 const apply=page.getByRole("button",{name:"Применить UDP-порт",exact:true});
 await expect(apply).toBeEnabled(); await apply.click();
 await expect(page.getByRole("alert")).toContainText("Прежние UDP-порты восстановлены");
 await expect(page.locator(".port-operation")).toHaveCount(0);
 await expect(page.getByText("Для проверки сначала запустите ядро.",{exact:true})).toHaveCount(0);
});
test("crashes of an unselected core appear once without repeated polling alerts",async({page})=>{
 await mockPanel(page);
 const core={id:"default",name:"Основной",slot:0,running:true,version:"v2.13.0",host:"vpn.example.org",port:"8443",updating:false,authMode:"panel"};
 await page.route("http://panel.test/api/instances",route=>route.fulfill({json:[core,{...core,id:"other",name:"Рабочий",running:false,watchdog:{desiredRunning:true,state:"failed",lastCrash:"crash-1",lastError:"Не удалось запустить ядро",message:"Перезапуск не помог"}}]}));
 await page.reload();
 await expect(page.getByRole("alert")).toContainText("Ошибка ядра: Рабочий");
 await expect(page.getByRole("alert")).toHaveCount(1);
 await page.getByRole("button",{name:"Закрыть уведомление",exact:true}).click();
 await page.waitForTimeout(5500);
 await expect(page.getByRole("alert")).toHaveCount(0);
});
test("invalid server responses become readable notifications without exposing the body",async({page})=>{
 await mockPanel(page);
 await page.route("http://panel.test/api/admin/transfer",route=>route.fulfill({status:502,contentType:"text/html",body:"<html>private-debug-content</html>"}));
 await page.getByRole("button",{name:"Настройки",exact:true}).click();
 await page.getByRole("button",{name:"Экспортировать данные",exact:true}).click();
 await expect(page.getByRole("alert")).toContainText("Панель вернула некорректный ответ");
 await expect(page.locator("body")).not.toContainText("private-debug-content");
});
