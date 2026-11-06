import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
export const YAML_HIGHLIGHT = HighlightStyle.define([
  { tag: [tags.propertyName, tags.attributeName], class: "yaml-key" },
  { tag: [tags.string, tags.special(tags.string)], class: "yaml-string" },
  { tag: [tags.number, tags.bool, tags.null], class: "yaml-number" },
  { tag: tags.comment, class: "yaml-comment" },
  { tag: [tags.punctuation, tags.meta], class: "yaml-punctuation" },
]);
