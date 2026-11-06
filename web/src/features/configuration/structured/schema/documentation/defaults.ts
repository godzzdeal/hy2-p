import order from "@config-schema";
const ORDER: Readonly<Record<string, readonly string[]>> = order;
export const FIELD_DEFAULTS: Readonly<Record<string, string | number | boolean>> = {
  listen: ":443",
  "tls.sniGuard": "dns-san",
  "acme.type": "http",
  "quic.initStreamReceiveWindow": 8388608,
  "quic.maxStreamReceiveWindow": 8388608,
  "quic.initConnReceiveWindow": 20971520,
  "quic.maxConnReceiveWindow": 20971520,
  "quic.maxIdleTimeout": "30s",
  "quic.maxIncomingStreams": 1024,
  "quic.disablePathMTUDiscovery": false,
  "quic.disableStatelessReset": false,
  ignoreClientBandwidth: false,
  "congestion.type": "bbr",
  "congestion.bbrProfile": "standard",
  speedTest: false,
  disableUDP: false,
  udpIdleTimeout: "60s",
};
function ranks(path: string): number[] {
  const parts = path.split(".");
  return parts.map((part, index) => {
    const parent = index ? parts.slice(0, index).join(".") : "$";
    const rank = ORDER[parent]?.indexOf(part) ?? -1;
    return rank < 0 ? Number.MAX_SAFE_INTEGER : rank;
  });
}
export function compareFields(left: { path: string }, right: { path: string }): number {
  const first = ranks(left.path),
    second = ranks(right.path);
  for (let index = 0; index < Math.max(first.length, second.length); index++) {
    const difference = (first[index] ?? -1) - (second[index] ?? -1);
    if (difference) return difference;
  }
  return 0;
}
