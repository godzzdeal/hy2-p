import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { styleClass } from "@/styles/runtime";
export const YAML_HIGHLIGHT = HighlightStyle.define([
  { tag: [tags.propertyName, tags.attributeName], class: styleClass("yaml-key") },
  { tag: [tags.string, tags.special(tags.string)], class: styleClass("yaml-string") },
  { tag: [tags.number, tags.bool, tags.null], class: styleClass("yaml-number") },
  { tag: tags.comment, class: styleClass("yaml-comment") },
  { tag: [tags.punctuation, tags.meta], class: styleClass("yaml-punctuation") },
]);
