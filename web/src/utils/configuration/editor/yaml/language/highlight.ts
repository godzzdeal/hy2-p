import { cn } from "@/utils/cn";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
export const YAML_HIGHLIGHT = HighlightStyle.define([
  { tag: [tags.propertyName, tags.attributeName], class: cn("yaml-key") },
  { tag: [tags.string, tags.special(tags.string)], class: cn("yaml-string") },
  { tag: [tags.number, tags.bool, tags.null], class: cn("yaml-number") },
  { tag: tags.comment, class: cn("yaml-comment") },
  { tag: [tags.punctuation, tags.meta], class: cn("yaml-punctuation") },
]);
