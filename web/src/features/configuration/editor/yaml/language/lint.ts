import { parseDocument } from "yaml";
import { type Diagnostic } from "@codemirror/lint";
export function yamlDiagnostics(source: string): Diagnostic[] {
  return parseDocument(source).errors.map((error) => ({
    from: Math.min(error.pos[0], source.length),
    to: Math.min(error.pos[1], source.length),
    severity: "error",
    message: error.message,
  }));
}
