import { jsx as createJsx, jsxs as createJsxs } from "react/jsx-runtime";
import { styledProps } from "@/styles/runtime/class-names";
export { Fragment, type JSX } from "react/jsx-runtime";

export function jsx(...[type, props, key]: Parameters<typeof createJsx>) {
  return createJsx(type, styledProps(type, props), key);
}
export function jsxs(...[type, props, key]: Parameters<typeof createJsxs>) {
  return createJsxs(type, styledProps(type, props), key);
}
