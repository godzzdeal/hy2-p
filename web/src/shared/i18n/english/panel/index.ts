import { EDITOR } from "./editor";
import { INSTALL } from "./install";
import { DOCUMENTATION } from "./configuration";
export const PANEL = { ...EDITOR, ...INSTALL, ...DOCUMENTATION };
