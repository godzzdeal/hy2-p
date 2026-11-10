import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { WEB_ROOT } from "../paths.ts";
import { CLASS_MAPPING_FILE } from "../styles/mapping.ts";
import { transformTest } from "./selectors.ts";

const sourceRoot = path.join(WEB_ROOT, "tests");
const cacheRoot = path.join(WEB_ROOT, ".cache");
const targetRoot = path.join(cacheRoot, "tests");
if (!path.resolve(targetRoot).startsWith(path.resolve(cacheRoot) + path.sep))
  throw new Error("Invalid test output directory");
const parsed: unknown = JSON.parse(readFileSync(CLASS_MAPPING_FILE, "utf8"));
if (
  typeof parsed !== "object" ||
  parsed === null ||
  Object.values(parsed).some((value) => typeof value !== "string")
)
  throw new Error("Invalid style class mapping");
const names = parsed as Record<string, string>;
rmSync(targetRoot, { recursive: true, force: true });

function prepare(folder: string): void {
  const target = path.join(targetRoot, path.relative(sourceRoot, folder));
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    const output = path.join(target, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "test-results") prepare(file);
      continue;
    }
    if (!file.endsWith(".ts")) {
      cpSync(file, output);
      continue;
    }
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    writeFileSync(output, transformTest(source, names));
  }
}
prepare(sourceRoot);
