import { isMap, type Document } from "yaml";
const BRANCHES: Readonly<Record<string, readonly string[]>> = {
  obfs: ["salamander", "gecko"],
  resolver: ["udp", "tcp", "tls", "https"],
  masquerade: ["file", "proxy", "string"],
  auth: ["password", "userpass", "http", "command"],
  acme: ["http", "tls", "dns"],
};
export function deleteField(document: Document, parts: string[]): void {
  if (!document.hasIn(parts)) return;
  document.deleteIn(parts);
  for (let length = parts.length - 1; length > 0; length--) {
    const parent = parts.slice(0, length);
    const node = document.getIn(parent, true);
    if (!isMap(node) || node.items.length) break;
    document.deleteIn(parent);
  }
}
export function resetDependencies(document: Document, path: string, value: unknown): void {
  const parts = path.split(".");
  const group = parts.slice(0, -1).join(".");
  const isReset = value === "" || value === undefined;
  if (parts.at(-1) === "type" && BRANCHES[group]) {
    if (isReset && group !== "acme") {
      deleteField(document, [group]);
      return;
    }
    for (const branch of BRANCHES[group]) {
      if (branch !== value) deleteField(document, [...parts.slice(0, -1), branch]);
    }
  }
  if (path === "congestion.type" && value !== "bbr") deleteField(document, ["congestion", "bbrProfile"]);
  if (path === "acme.dns.name" && document.getIn(parts) !== value)
    deleteField(document, ["acme", "dns", "config"]);
}
