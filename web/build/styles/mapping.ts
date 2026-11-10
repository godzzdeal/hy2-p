import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { WEB_ROOT } from "../paths.ts";

interface IClassMapping {
  resourcePath: string;
  exports: Array<{ name: string; value: string }>;
}
export const CLASS_MAPPING_FILE = path.resolve(WEB_ROOT, ".cache/style-classes.json");
export function writeClassMapping({ resourcePath, exports }: IClassMapping): void {
  if (!resourcePath.endsWith("index.module.scss")) return;
  const names = Object.fromEntries(exports.map(({ name, value }) => [name, value]));
  mkdirSync(path.dirname(CLASS_MAPPING_FILE), { recursive: true });
  writeFileSync(CLASS_MAPPING_FILE, JSON.stringify(names));
}
