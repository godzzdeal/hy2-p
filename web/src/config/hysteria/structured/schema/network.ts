import { type IConfigSection } from "@/services/configuration/structured/field-types";
export const NETWORK_SECTIONS: readonly IConfigSection[] = [
  {
    id: "resolver",
    title: "DNS и домены",
    fields: [
      {
        path: "resolver.type",
        label: "DNS-резолвер",
        kind: "select",
        options: ["udp", "tcp", "tls", "https"],
      },
      ...["udp", "tcp", "tls", "https"].flatMap((type) => [
        {
          path: "resolver." + type + ".addr",
          label: "Адрес DNS " + type,
          kind: "text" as const,
          when: { path: "resolver.type", value: type },
        },
        {
          path: "resolver." + type + ".timeout",
          label: "Таймаут DNS " + type,
          kind: "text" as const,
          when: { path: "resolver.type", value: type },
        },
      ]),
      ...["tls", "https"].flatMap((type) => [
        {
          path: "resolver." + type + ".sni",
          label: "SNI DNS " + type,
          kind: "text" as const,
          when: { path: "resolver.type", value: type },
        },
        {
          path: "resolver." + type + ".insecure",
          label: "Не проверять сертификат DNS " + type,
          kind: "toggle" as const,
          when: { path: "resolver.type", value: type },
        },
      ]),
      { path: "sniff.enable", label: "Включить sniffing", kind: "toggle" },
      { path: "sniff.timeout", label: "Таймаут sniffing", kind: "text" },
      { path: "sniff.rewriteDomain", label: "Перезаписывать домены", kind: "toggle" },
      { path: "sniff.tcpPorts", label: "TCP-порты sniffing", kind: "text" },
      { path: "sniff.udpPorts", label: "UDP-порты sniffing", kind: "text" },
    ],
  },
  {
    id: "routing",
    title: "Правила трафика",
    fields: [
      { path: "acl.file", label: "Файл правил ACL", kind: "text" },
      { path: "acl.inline", label: "Правила ACL, по одному в строке", kind: "lines" },
      { path: "acl.geoip", label: "Путь к GeoIP", kind: "text" },
      { path: "acl.geosite", label: "Путь к GeoSite", kind: "text" },
      { path: "acl.geoUpdateInterval", label: "Интервал обновления GeoIP / GeoSite", kind: "text" },
      { path: "outbounds", label: "Исходящие подключения: direct / socks5 / http (JSON)", kind: "json" },
    ],
  },
  {
    id: "masquerade",
    title: "Сайт маскировки",
    fields: [
      {
        path: "masquerade.type",
        label: "Режим маскировки",
        kind: "select",
        options: ["file", "proxy", "string"],
      },
      {
        path: "masquerade.file.dir",
        label: "Каталог файлов маскировки",
        kind: "text",
        when: { path: "masquerade.type", value: "file" },
      },
      {
        path: "masquerade.proxy.url",
        label: "URL сайта маскировки",
        kind: "text",
        when: { path: "masquerade.type", value: "proxy" },
      },
      ...["rewriteHost", "insecure", "xForwarded"].map((name) => ({
        path: "masquerade.proxy." + name,
        label: name,
        kind: "toggle" as const,
        when: { path: "masquerade.type", value: "proxy" },
      })),
      {
        path: "masquerade.string.content",
        label: "Ответ маскировки",
        kind: "multiline",
        when: { path: "masquerade.type", value: "string" },
      },
      {
        path: "masquerade.string.headers",
        label: "HTTP-заголовки маскировки",
        kind: "pairs",
        when: { path: "masquerade.type", value: "string" },
      },
      {
        path: "masquerade.string.statusCode",
        label: "HTTP-код ответа",
        kind: "number",
        when: { path: "masquerade.type", value: "string" },
      },
      { path: "masquerade.listenHTTP", label: "HTTP-порт маскировки", kind: "text" },
      { path: "masquerade.listenHTTPS", label: "HTTPS-порт маскировки", kind: "text" },
      { path: "masquerade.forceHTTPS", label: "Перенаправлять маскировку на HTTPS", kind: "toggle" },
    ],
  },
  {
    id: "advanced",
    title: "Особые режимы",
    fields: [
      { path: "realm", label: "Hysteria Realms (JSON)", kind: "json" },
      { path: "mimic.enabled", label: "Включить Mimic (требует отдельной настройки Linux)", kind: "toggle" },
      { path: "mimic.interface", label: "Интерфейс Mimic", kind: "text" },
      { path: "mimic.xdpMode", label: "XDP-режим", kind: "select", options: ["native", "skb"] },
      { path: "mimic.path", label: "Путь к программе Mimic", kind: "text" },
      { path: "mimic.extraArgs", label: "Аргументы Mimic, по одному в строке", kind: "lines" },
    ],
  },
];
