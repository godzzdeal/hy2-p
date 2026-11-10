import path from "node:path";
import { readFileSync } from "node:fs";
export const WEB_ROOT = path.resolve(import.meta.dirname, "..");
export const PANEL_VERSION = readFileSync(
  path.resolve(WEB_ROOT, "../internal/buildinfo/VERSION"),
  "utf8",
).trim();
