export const LOG_VIEW = { maxLines: 500, bottomThreshold: 24 } as const;
export type TLogLevel = "" | "error" | "warn" | "info";
const LEVELS = { error: /\b(ERROR|FATAL|PANIC)\b/i, warn: /\bWARN(?:ING)?\b/i, info: /\bINFO\b/i };
export function filterLogs(text: string, search: string, level: TLogLevel): string[] {
  const query = search.toLocaleLowerCase();
  return text
    .split("\n")
    .filter(
      (line) =>
        line.trim() &&
        (!query || line.toLocaleLowerCase().includes(query)) &&
        (!level || LEVELS[level].test(line)),
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
