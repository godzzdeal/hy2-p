export const ACL_MODES = ["rule", "comment", "text"] as const;
export const ACL_ADDRESS_TYPES = ["all", "domain", "suffix", "geoip", "geosite", "ip", "cidr"] as const;
export const ACL_PROTOCOLS = ["*", "tcp", "udp"] as const;
export const ACL_OUTBOUNDS = ["direct", "reject", "default"] as const;
export const NEW_ACL_RULE = -1;
export const ACL_MIN_PORT = 1;
export const ACL_MAX_PORT = 65535;
export const IPV4_OCTETS = 4;
export const IPV4_MAX_OCTET = 255;
export const IPV4_BITS = 32;
export const IPV6_BITS = 128;

export type TAclMode = (typeof ACL_MODES)[number];
export type TAclAddressType = (typeof ACL_ADDRESS_TYPES)[number];

export interface IAclRule {
  mode: TAclMode;
  outbound: string;
  addressType: TAclAddressType;
  address: string;
  protocol: string;
  ports: string;
  hijack: string;
  text: string;
}

export const EMPTY_ACL_RULE: IAclRule = {
  mode: "rule",
  outbound: "direct",
  addressType: "all",
  address: "",
  protocol: "*",
  ports: "*",
  hijack: "",
  text: "",
};

export const ACL_MODE_LABELS = { rule: "Правило", comment: "Комментарий", text: "Текст ACL" } as const;
export const ACL_ADDRESS_LABELS = {
  all: "Все адреса",
  domain: "Домен или маска",
  suffix: "Домен и поддомены",
  geoip: "GeoIP",
  geosite: "GeoSite",
  ip: "IP-адрес",
  cidr: "Подсеть CIDR",
} as const;
