import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { WEB_ROOT } from "../paths.ts";

function sourceFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : file.endsWith(".tsx") ? [file] : [];
  });
}
export function sourceClasses(): Set<string> {
  const names = new Set<string>();
  function collect(node: ts.Node): void {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      for (const token of node.text.split(/\s+/)) if (token) names.add(token);
    }
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) names.add(node.name.text);
    ts.forEachChild(node, collect);
  }
  function visit(node: ts.Node): void {
    if (ts.isJsxAttribute(node) && node.name.getText() === "className" && node.initializer)
      collect(node.initializer);
    else ts.forEachChild(node, visit);
  }
  for (const file of sourceFiles(path.join(WEB_ROOT, "src"))) {
    visit(
      ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
    );
  }
  return names;
}
