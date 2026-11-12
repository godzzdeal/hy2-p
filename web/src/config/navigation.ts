import { FileCode2, LayoutDashboard, Rss, Server, Settings2, Users } from "@/components/elements/icons";
import { HysteriaMark } from "@/components/elements/hysteria";
export const PageEnum = {
  Overview: "overview",
  Users: "users",
  Configuration: "config",
  Core: "core",
  Instances: "instances",
  Subscriptions: "subscriptions",
  Admin: "admin",
} as const;
export type TPage = (typeof PageEnum)[keyof typeof PageEnum];
export const NAVIGATION = [
  {
    id: PageEnum.Overview,
    label: "Обзор",
    title: "Обзор сервера",
    description: "Доступ, подключения и состояние вашего сервера.",
    icon: LayoutDashboard,
  },
  {
    id: PageEnum.Users,
    label: "Пользователи",
    title: "Пользователи",
    description: "Пользователи, группы и права доступа.",
    icon: Users,
  },
  {
    id: PageEnum.Subscriptions,
    label: "Подписка",
    title: "Подписка",
    description: "Название, эмодзи и объявления для пользователей.",
    icon: Rss,
  },
  {
    id: PageEnum.Instances,
    label: "Экземпляры",
    title: "Экземпляры HY2",
    description: "Отдельные конфигурации и управление экземплярами.",
    icon: Server,
  },
  {
    id: PageEnum.Configuration,
    label: "Конфигурация",
    title: "Конфигурация сервера",
    description: "Свойства Hysteria2 и полный YAML.",
    icon: FileCode2,
  },
  {
    id: PageEnum.Core,
    label: "Управление HY2",
    title: "Управление HY2",
    description: "Запуск, версия и журнал экземпляра.",
    icon: HysteriaMark,
  },
  {
    id: PageEnum.Admin,
    label: "Настройки",
    title: "Настройки панели",
    description: "Вход, порт и HTTPS",
    icon: Settings2,
  },
] as const;

export const PAGE_ROUTES: Record<TPage, string> = {
  overview: "/",
  users: "/users",
  config: "/configuration",
  core: "/hy2",
  instances: "/instances",
  subscriptions: "/subscriptions",
  admin: "/settings",
};
