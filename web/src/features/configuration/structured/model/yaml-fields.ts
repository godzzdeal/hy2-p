import { parseDocument, isCollection, isScalar } from "yaml";
import type { Document } from "yaml";
import type { TFieldKind } from "./field-types";
export function readField(document: Document, path: string): unknown {
  const node: unknown = document.getIn(path.split("."), true);
  if (isScalar(node)) return node.value as unknown;
  if (isCollection(node)) return node.toJSON() as unknown;
  return node;
}
export function updateField(source: string, path: string, value: unknown): string {
  const document = parseDocument(source);
  if (document.errors.length) throw document.errors[0];
  if (value === "") document.deleteIn(path.split("."));
  else document.setIn(path.split("."), value);
  return document.toString();
}
export function parseField(value: string, kind: TFieldKind): unknown {
  if (kind === "number") return value === "" ? "" : Number(value);
  if (kind === "lines")
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  if (kind === "json") return value === "" ? "" : (JSON.parse(value) as unknown);
  return value;
}
export function formatField(value: unknown, kind: TFieldKind): string {
  if (value === undefined || value === null) return "";
  if (kind === "json") return JSON.stringify(value, null, 2);
  if (Array.isArray(value) && kind === "lines") return value.join("\n");
  return String(value);
}
export function certificateMode(source: string, mode: string): string {
  const document = parseDocument(source);
  if (document.errors.length) throw document.errors[0];
  if (mode === "acme") {
    document.delete("tls");
    if (!document.has("acme"))
      document.set("acme", {
        domains: [],
        email: "",
        ca: "letsencrypt",
        type: "dns",
        dir: "/data/acme-hy2",
        dns: { name: "cloudflare", config: {} },
      });
  } else {
    document.delete("acme");
    if (!document.has("tls")) document.set("tls", { cert: "", key: "" });
  }
  return document.toString();
}
