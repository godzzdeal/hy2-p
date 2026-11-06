import { Settings2, FileCode2, LayoutDashboard, Terminal, Users, Rss } from "lucide-react";
export const PageEnum = {
  Overview: "overview",
  Users: "users",
  Configuration: "config",
  Core: "core",
  Subscriptions: "subscriptions",
  Admin: "admin",
} as const;
export type TPage = (typeof PageEnum)[keyof typeof PageEnum];
export const NAVIGATION = [
  {
    id: PageEnum.Overview,
    label: "Обзор",
    title: "Всё под контролем",
    description: "Доступ, подключения и состояние вашего сервера.",
    icon: LayoutDashboard,
  },
  {
    id: PageEnum.Users,
    label: "Пользователи",
    title: "Пользователи",
    description: "Управляйте доступом и подключениями.",
    icon: Users,
  },
  {
    id: PageEnum.Subscriptions,
    label: "Подписки",
    title: "Подписки",
    description: "Название, флаг и сообщения для пользователей Happ.",
    icon: Rss,
  },
  {
    id: PageEnum.Configuration,
    label: "Конфигурация",
    title: "Конфигурация сервера",
    description: "Все параметры Hysteria2 в одном месте.",
    icon: FileCode2,
  },
  {
    id: PageEnum.Core,
    label: "Ядро и журнал",
    title: "Ядро и журнал",
    description: "Управляйте процессом Hysteria2.",
    icon: Terminal,
  },
  {
    id: PageEnum.Admin,
    label: "Настройки",
    title: "Настройки панели",
    description: "Вход, порт и HTTPS",
    icon: Settings2,
  },
] as const;
