import { CERTIFICATE_SECTIONS } from "@/config/hysteria/structured/schema/certificates";
import { compareFields } from "@/config/hysteria/structured/schema/documentation/defaults";
import { EXTRA_FIELDS } from "@/config/hysteria/structured/schema/documentation/extra";
import { NETWORK_SECTIONS } from "@/config/hysteria/structured/schema/network";
import { TRANSPORT_SECTIONS } from "@/config/hysteria/structured/schema/transport";
import { type IConfigSection } from "@/services/configuration/structured/field-types";
import { OUTBOUND_FIELDS } from "@/utils/configuration/structured/outbounds/model";
const FIELDS = [...TRANSPORT_SECTIONS, ...CERTIFICATE_SECTIONS, ...NETWORK_SECTIONS]
  .flatMap((section) => section.fields)
  .filter((field) => field.path !== "realm");
const GROUPS = [
  { id: "listen", title: "Listen", anchor: "listen", paths: ["listen"] },
  { id: "realm", title: "Realm", anchor: "realm", paths: ["realm."] },
  { id: "tls", title: "TLS / ACME", anchor: "tls", paths: ["tls.", "acme."] },
  { id: "ech", title: "ECH", anchor: "ech", paths: ["ech."] },
  { id: "obfs", title: "Obfuscation", anchor: "obfuscation", paths: ["obfs."] },
  {
    id: "quic",
    title: "QUIC parameters",
    anchor: "quic-parameters",
    paths: ["quic."],
  },
  {
    id: "mimic",
    title: "Mimic",
    anchor: "mimic-fake-tcp-linux-only",
    paths: ["mimic."],
  },
  {
    id: "bandwidth",
    title: "Bandwidth",
    anchor: "bandwidth",
    paths: ["bandwidth.", "ignoreClientBandwidth"],
  },
  {
    id: "congestion",
    title: "Congestion",
    anchor: "congestion",
    paths: ["congestion."],
  },
  {
    id: "speedTest",
    title: "Speed Test",
    anchor: "speed-test",
    paths: ["speedTest"],
  },
  {
    id: "udp",
    title: "UDP",
    anchor: "udp",
    paths: ["disableUDP", "udpIdleTimeout"],
  },
  {
    id: "auth",
    title: "Authentication",
    anchor: "authentication",
    paths: ["auth."],
  },
  {
    id: "resolver",
    title: "Resolver",
    anchor: "resolver",
    paths: ["resolver."],
  },
  {
    id: "sniff",
    title: "Protocol Sniffing",
    anchor: "protocol-sniffing",
    paths: ["sniff."],
  },
  { id: "acl", title: "ACL", anchor: "acl", paths: ["acl."] },
  {
    id: "outbounds",
    title: "Outbounds",
    anchor: "outbounds",
    paths: ["outbounds"],
  },
  {
    id: "trafficStats",
    title: "Traffic Stats API",
    anchor: "traffic-stats-api-http",
    paths: ["trafficStats."],
  },
  {
    id: "masquerade",
    title: "Masquerade",
    anchor: "masquerade",
    paths: ["masquerade."],
  },
] as const;
export const DOCUMENTATION_SECTIONS: readonly IConfigSection[] = GROUPS.map((group) => ({
  id: group.id,
  title: group.title,
  anchor: group.anchor,
  fields: [
    ...FIELDS,
    ...EXTRA_FIELDS,
    ...OUTBOUND_FIELDS.map((field) => ({
      ...field,
      path: "outbounds[]." + field.path,
    })),
  ]
    .filter((field) =>
      group.paths.some((path) =>
        path.endsWith(".")
          ? field.path.startsWith(path)
          : field.path === path || (path === "outbounds" && field.path.startsWith("outbounds[]")),
      ),
    )
    .sort(compareFields),
}));
export const CONFIGURATION_DOCS = "https://v2.hysteria.network/docs/advanced/Full-Server-Config/";
