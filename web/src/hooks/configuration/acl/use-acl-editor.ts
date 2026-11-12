import { useState, useDeferredValue } from "react";
import type { Document } from "yaml";
import { readField } from "@/utils/configuration/structured/yaml/fields";
import {
  aclOutboundNames,
  NEW_ACL_RULE,
  moveAclRule,
  updateAclRule,
  readAclLines,
  parseAclRule,
} from "@/utils/configuration/structured/acl";
import { usePagination } from "@/hooks/ui/use-pagination";

export interface IAclEditor {
  document: Document;
  onSet: (path: string, value: unknown) => void;
}

export function useAclEditor({ document, onSet }: IAclEditor) {
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());
  const saved = readField(document, "acl.inline");
  const parsed = readAclLines(saved);
  const hasInvalidValue = parsed === null;
  const lines = parsed ?? [];
  const filtered = lines
    .map((source, index) => ({ source, index }))
    .filter((item) => item.source.toLocaleLowerCase().includes(deferredSearch));
  const pagination = usePagination(filtered);
  const outbounds = readField(document, "outbounds");
  const outboundNames = aclOutboundNames(outbounds);
  const hasFile = Boolean(readField(document, "acl.file"));
  function onSave(source: string) {
    if (selected === null || hasInvalidValue) return;
    onSet("acl.inline", updateAclRule(lines, selected, source));
    setSelected(null);
  }
  function onSearch(value: string) {
    setSearch(value);
    pagination.setPage(0);
  }
  return {
    lines,
    hasInvalidValue,
    hasInline: saved !== undefined && saved !== null,
    rows: pagination.items.map((item) => ({ ...item, rule: parseAclRule(item.source) })),
    pagination,
    search,
    onSearch,
    hasFile,
    selected,
    setSelected,
    outboundNames,
    onSave,
    onAdd: () => setSelected(NEW_ACL_RULE),
    onRemove: (index: number) =>
      onSet(
        "acl.inline",
        lines.filter((_, position) => position !== index),
      ),
    onMove: (index: number, direction: number) => onSet("acl.inline", moveAclRule(lines, index, direction)),
    onInline: () => onSet("acl.file", undefined),
  };
}
