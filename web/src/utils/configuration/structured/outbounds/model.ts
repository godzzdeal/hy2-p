import { type IConfigField } from "@/services/configuration/structured/field-types";
import { orderConfiguration } from "@/utils/configuration/structured/yaml/ordering";
import { isMap, isSeq, parseDocument } from "yaml";
export const OUTBOUND_TYPES = ["direct", "socks5", "http"] as const;
export const OUTBOUND_FIELDS: readonly IConfigField[] = [
  {
    path: "name",
    label: "Имя исходящего подключения для правил ACL.",
    kind: "text",
  },
  {
    path: "type",
    label: "Тип исходящего подключения.",
    kind: "select",
    options: OUTBOUND_TYPES,
  },
  {
    path: "direct.mode",
    label: "Порядок выбора IPv4 / IPv6.",
    kind: "select",
    options: ["auto", "64", "46", "4", "6"],
    when: { path: "type", value: "direct" },
  },
  {
    path: "direct.bindIPv4",
    label: "Исходящий IPv4-адрес.",
    kind: "text",
    when: { path: "type", value: "direct" },
  },
  {
    path: "direct.bindIPv6",
    label: "Исходящий IPv6-адрес.",
    kind: "text",
    when: { path: "type", value: "direct" },
  },
  {
    path: "direct.bindDevice",
    label: "Сетевой интерфейс исходящего соединения.",
    kind: "text",
    when: { path: "type", value: "direct" },
  },
  {
    path: "direct.fastOpen",
    label: "Открывать TCP-соединение после первого пакета клиента.",
    kind: "toggle",
    when: { path: "type", value: "direct" },
  },
  {
    path: "socks5.addr",
    label: "Адрес SOCKS5-прокси, например 127.0.0.1:1080.",
    kind: "text",
    when: { path: "type", value: "socks5" },
  },
  {
    path: "socks5.username",
    label: "Логин SOCKS5-прокси.",
    kind: "text",
    when: { path: "type", value: "socks5" },
  },
  {
    path: "socks5.password",
    label: "Пароль SOCKS5-прокси.",
    kind: "password",
    when: { path: "type", value: "socks5" },
  },
  {
    path: "http.url",
    label: "URL HTTP-прокси, при необходимости с логином и паролем.",
    kind: "text",
    when: { path: "type", value: "http" },
  },
  {
    path: "http.insecure",
    label: "Отключить проверку TLS-сертификата HTTPS-прокси.",
    kind: "toggle",
    when: { path: "type", value: "http" },
  },
];
export type TOutboundAction =
  | { type: "add" }
  | { type: "remove"; index: number }
  | { type: "set"; index: number; path: string; value: unknown };
export function isOutboundList(value: unknown): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.every((entry: unknown) => !!entry && typeof entry === "object" && !Array.isArray(entry))
  );
}
export function outboundValue(value: Record<string, unknown>, path: string): unknown {
  let current: unknown = value;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
export function editOutbounds(source: string, action: TOutboundAction): string {
  const document = parseDocument(source);
  if (document.errors.length) throw document.errors[0];
  if (!document.has("outbounds")) document.set("outbounds", document.createNode([]));
  const list = document.get("outbounds", true);
  if (!isSeq(list)) throw new Error("outbounds должен быть списком");
  if (action.type === "add") {
    const names = new Set(list.items.map((entry) => (isMap(entry) ? entry.get("name") : "")));
    let suffix = list.items.length + 1;
    while (names.has("outbound_" + suffix)) suffix++;
    list.add(document.createNode({ name: "outbound_" + suffix, type: "direct" }));
  } else if (action.type === "remove") {
    list.items.splice(action.index, 1);
    if (!list.items.length) document.delete("outbounds");
  } else {
    const path = ["outbounds", action.index, ...action.path.split(".")];
    if (action.path === "type")
      for (const type of OUTBOUND_TYPES) {
        if (type !== action.value) document.deleteIn(["outbounds", action.index, type]);
      }
    if (action.value === undefined || action.value === "") {
      document.deleteIn(path);
      const parent = path.slice(0, -1);
      const node = document.getIn(parent, true);
      if (isMap(node) && !node.items.length) document.deleteIn(parent);
    } else document.setIn(path, action.value);
  }
  return orderConfiguration(document.toString());
}
