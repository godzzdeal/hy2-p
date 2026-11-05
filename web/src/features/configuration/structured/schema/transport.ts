import type { IConfigSection } from "@/features/configuration/structured/model";
export const TRANSPORT_SECTIONS: readonly IConfigSection[] = [
  {
    id: "server",
    title: "Сервер и скорость",
    fields: [
      {
        path: "listen",
        label: "Адрес прослушивания Hysteria2",
        kind: "text",
        hint: "Например :8443. Это UDP-порт ядра, а не порт веб-панели.",
      },
      {
        path: "bandwidth.up",
        label: "Отправка сервера",
        kind: "text",
        hint: "Например 100 mbps. Скорость загрузки клиента.",
      },
      { path: "bandwidth.down", label: "Приём сервера", kind: "text" },
      { path: "bandwidth.disableLossCompensation", label: "Отключить компенсацию потерь", kind: "toggle" },
      { path: "ignoreClientBandwidth", label: "Игнорировать скорость клиента", kind: "toggle" },
      { path: "congestion.type", label: "Контроль перегрузки", kind: "select", options: ["bbr", "reno"] },
      {
        path: "congestion.bbrProfile",
        label: "Профиль BBR",
        kind: "select",
        options: ["standard", "conservative", "aggressive"],
      },
      { path: "speedTest", label: "Тест скорости", kind: "toggle" },
      { path: "disableUDP", label: "Отключить UDP-проксирование", kind: "toggle" },
      { path: "udpIdleTimeout", label: "Таймаут UDP", kind: "text" },
    ],
  },
  {
    id: "quic",
    title: "QUIC",
    fields: [
      ...[
        "initStreamReceiveWindow",
        "maxStreamReceiveWindow",
        "initConnReceiveWindow",
        "maxConnReceiveWindow",
        "maxIncomingStreams",
      ].map((name) => ({ path: "quic." + name, label: name, kind: "number" as const })),
      { path: "quic.maxIdleTimeout", label: "QUIC: таймаут простоя", kind: "text" },
      { path: "quic.disablePathMTUDiscovery", label: "Отключить определение MTU", kind: "toggle" },
      { path: "quic.disableStatelessReset", label: "Отключить stateless reset", kind: "toggle" },
    ],
  },
  {
    id: "obfs",
    title: "Обфускация",
    fields: [
      { path: "obfs.type", label: "Тип обфускации", kind: "select", options: ["salamander", "gecko"] },
      {
        path: "obfs.salamander.password",
        label: "Пароль Salamander",
        kind: "password",
        when: { path: "obfs.type", value: "salamander" },
      },
      {
        path: "obfs.gecko.password",
        label: "Пароль Gecko",
        kind: "password",
        when: { path: "obfs.type", value: "gecko" },
      },
      {
        path: "obfs.gecko.minPacketSize",
        label: "Минимальный пакет Gecko",
        kind: "number",
        when: { path: "obfs.type", value: "gecko" },
      },
      {
        path: "obfs.gecko.maxPacketSize",
        label: "Максимальный пакет Gecko",
        kind: "number",
        when: { path: "obfs.type", value: "gecko" },
      },
    ],
  },
];
