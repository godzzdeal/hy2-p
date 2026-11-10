import { jsxDEV as createJsx } from "react/jsx-dev-runtime";
import { styledProps } from "@/styles/runtime/class-names";
export { Fragment, type JSX } from "react/jsx-dev-runtime";

export function jsxDEV(...[type, props, key, isStatic, source, self]: Parameters<typeof createJsx>) {
  return createJsx(type, styledProps(type, props), key, isStatic, source, self);
}
