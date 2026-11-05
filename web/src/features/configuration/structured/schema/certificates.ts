import type { IConfigSection } from "@/features/configuration/structured/model";
export const CERTIFICATE_SECTIONS: readonly IConfigSection[] = [
  {
    id: "tls",
    title: "TLS: собственный сертификат",
    fields: [
      { path: "tls.cert", label: "Путь к сертификату", kind: "text" },
      { path: "tls.key", label: "Путь к приватному ключу", kind: "text" },
      {
        path: "tls.sniGuard",
        label: "Проверка SNI",
        kind: "select",
        options: ["dns-san", "strict", "disable"],
      },
      { path: "tls.clientCA", label: "CA клиентских сертификатов (mTLS)", kind: "text" },
      { path: "ech.keyPath", label: "Путь к ключу ECH", kind: "text" },
    ],
  },
  {
    id: "acme",
    title: "ACME: выпуск и автопродление",
    fields: [
      { path: "acme.domains", label: "Домены, по одному в строке", kind: "lines" },
      { path: "acme.email", label: "Email для ACME", kind: "text" },
      { path: "acme.ca", label: "Центр сертификации", kind: "select", options: ["letsencrypt", "zerossl"] },
      { path: "acme.dir", label: "Каталог ACME на постоянном томе", kind: "text" },
      { path: "acme.listenHost", label: "Адрес прослушивания проверки домена", kind: "text" },
      {
        path: "acme.type",
        label: "Проверка владения доменом",
        kind: "select",
        options: ["http", "tls", "dns"],
      },
      {
        path: "acme.http.altPort",
        label: "Внутренний HTTP-порт проверки (снаружи 80)",
        kind: "number",
        when: { path: "acme.type", value: "http" },
      },
      {
        path: "acme.tls.altPort",
        label: "Внутренний TLS-порт проверки (снаружи 443)",
        kind: "number",
        when: { path: "acme.type", value: "tls" },
      },
      {
        path: "acme.dns.name",
        label: "DNS-провайдер",
        kind: "select",
        options: ["cloudflare", "duckdns", "gandi", "godaddy", "namecheap", "njalla", "porkbun", "vultr"],
        when: { path: "acme.type", value: "dns" },
      },
      {
        path: "acme.dns.config",
        label: "Параметры API DNS-провайдера",
        kind: "pairs",
        when: { path: "acme.type", value: "dns" },
        hint: "Используйте имена параметров из документации Hysteria2: например cloudflare_api_token.",
      },
    ],
  },
  {
    id: "auth",
    title: "Нативная аутентификация Hysteria2",
    fields: [
      {
        path: "auth.type",
        label: "Режим аутентификации",
        kind: "select",
        options: ["password", "userpass", "http", "command"],
      },
      {
        path: "auth.password",
        label: "Общий пароль",
        kind: "password",
        when: { path: "auth.type", value: "password" },
      },
      {
        path: "auth.userpass",
        label: "Логины и пароли клиентов",
        kind: "pairs",
        when: { path: "auth.type", value: "userpass" },
      },
      {
        path: "auth.http.url",
        label: "URL внешней HTTP-аутентификации",
        kind: "text",
        when: { path: "auth.type", value: "http" },
      },
      {
        path: "auth.http.insecure",
        label: "Не проверять TLS внешней аутентификации",
        kind: "toggle",
        when: { path: "auth.type", value: "http" },
      },
      {
        path: "auth.command",
        label: "Команда аутентификации",
        kind: "text",
        when: { path: "auth.type", value: "command" },
      },
    ],
  },
];
