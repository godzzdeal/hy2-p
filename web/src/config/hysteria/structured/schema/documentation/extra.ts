import { type IConfigField } from "@/services/configuration/structured/field-types";
export const EXTRA_FIELDS: readonly IConfigField[] = [
  { path: "realm.stunServers", label: "Список STUN-серверов", kind: "lines" },
  { path: "realm.stunTimeout", label: "Таймаут STUN", kind: "text" },
  { path: "realm.punchTimeout", label: "Таймаут hole punching", kind: "text" },
  { path: "realm.heartbeatInterval", label: "Интервал heartbeat", kind: "text" },
  { path: "realm.insecure", label: "Отключить проверку TLS rendezvous-сервера", kind: "toggle" },
  {
    path: "realm.ipMode",
    label: "Семейство IP для NAT traversal",
    kind: "select",
    options: ["dual", "v4", "v6"],
  },
  { path: "realm.portMapping.enabled", label: "UPnP / NAT-PMP", kind: "toggle" },
  { path: "realm.portMapping.timeout", label: "Таймаут запроса к шлюзу", kind: "text" },
  { path: "realm.portMapping.lifetime", label: "Время аренды порта", kind: "text" },
  {
    path: "trafficStats.listen",
    label: "Панель задаёт адрес статистики при запуске экземпляра.",
    kind: "text",
    managed: true,
  },
  {
    path: "trafficStats.secret",
    label: "Панель создаёт секрет статистики автоматически.",
    kind: "password",
    managed: true,
  },
];
