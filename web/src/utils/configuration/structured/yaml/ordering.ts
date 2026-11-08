import order from "@config-schema";
import { isAlias, isCollection, isMap, isPair, isScalar, isSeq, parseDocument, type Document } from "yaml";
const ORDER: Readonly<Record<string, readonly string[]>> = order;
interface IReferences {
  anchors: string[];
  aliases: string[];
}
function references(node: unknown, result: IReferences) {
  if (isAlias(node)) result.aliases.push(node.source);
  if ((isScalar(node) || isCollection(node)) && node.anchor) result.anchors.push(node.anchor);
  if (isPair(node)) {
    references(node.key, result);
    references(node.value, result);
  }
  if (isCollection(node)) node.items.forEach((item) => references(item, result));
}
function sortNode(node: unknown, path: string): void {
  if (isSeq(node)) {
    node.items.forEach((item) => sortNode(item, path + "[]"));
    return;
  }
  if (!isMap(node)) return;
  const fields = ORDER[path] ?? [];
  const ranked = node.items.map((pair, index) => {
    const key = isScalar(pair.key) ? String(pair.key.value) : typeof pair.key === "string" ? pair.key : "";
    const refs: IReferences = { anchors: [], aliases: [] };
    references(pair, refs);
    sortNode(pair.value, path ? path + "." + key : key);
    const rank = fields.indexOf(key);
    return { pair, index, refs, rank: rank < 0 ? fields.length : rank };
  });
  // Keep declarations before aliases, including anchors nested inside a different section.
  const owners = new Map<string, number>();
  for (const item of ranked)
    for (const anchor of item.refs.anchors) {
      if (owners.has(anchor)) return; // Reused anchor names depend on original document order.
      owners.set(anchor, item.index);
    }
  const pending = [...ranked].sort((left, right) => left.rank - right.rank);
  const emitted = new Set<number>();
  const sorted = [];
  while (pending.length) {
    const next = pending.findIndex((item) =>
      item.refs.aliases.every((alias) => {
        const owner = owners.get(alias);
        return owner === undefined || owner === item.index || emitted.has(owner);
      }),
    );
    if (next < 0) return;
    const [item] = pending.splice(next, 1);
    sorted.push(item.pair);
    emitted.add(item.index);
  }
  node.items = sorted;
}
export function orderDocument(document: Document): string {
  sortNode(document.contents, "");
  return document.toString();
}
export function orderConfiguration(source: string): string {
  const document = parseDocument(source);
  if (document.errors.length) throw document.errors[0];
  return orderDocument(document);
}
