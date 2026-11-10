import { PageEnum } from "@/config/navigation";
export const START_STEPS = [
  {
    page: PageEnum.Configuration,
    number: "01",
    title: "Настройте сервер",
    description: "Публичный адрес, порт и TLS-сертификат.",
  },
  {
    page: PageEnum.Core,
    number: "02",
    title: "Запустите Hysteria2",
    description: "Проверьте журнал запуска.",
  },
  {
    page: PageEnum.Users,
    number: "03",
    title: "Подключите устройство",
    description: "Создайте пользователя и получите QR-код.",
  },
] as const;
