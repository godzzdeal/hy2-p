export const LOG_VIEW = { maxLines: 500, bottomThreshold: 24 } as const;
export type TLogLevel = "" | "error" | "warn" | "info";
const LEVEL_TOKEN = /\b(INFO|WARN(?:ING)?|ERROR|FATAL|PANIC)\b/i;
export function logLevel(text: string): TLogLevel {
  const token = LEVEL_TOKEN.exec(text)?.[1].toUpperCase();
  if (token === "INFO") return "info";
  if (token === "WARN" || token === "WARNING") return "warn";
  return token ? "error" : "";
}
export function filterLogs(text: string, search: string, level: TLogLevel): string[] {
  const query = search.toLocaleLowerCase();
  return text
    .split("\n")
    .filter(
      (line) =>
        line.trim() &&
        (!query || line.toLocaleLowerCase().includes(query)) &&
        (!level || logLevel(line) === level),
    );
}
export function downloadLogs(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "hysteria2.log";
  link.click();
  URL.revokeObjectURL(url);
}
