import { cn } from "@/utils/cn";
import { LogClient } from "@/components/core/logs/lines/LogClient";
import { type ILogEntry } from "@/utils/core/logs";
import { logLevel } from "@/utils/core/logs/log-text";
export function LogLine({ text, client, search }: ILogEntry & { search: string }) {
  const position = search ? text.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) : -1;
  const level = logLevel(text);
  return (
    <div
      className={cn("log-line py-1 px-2 whitespace-pre-wrap wrap-anywhere", {
        "log-error text-danger": level === "error",
        "log-warning bg-surface-soft": level === "warn",
      })}
    >
      {client && <LogClient client={client} />}
      {position < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, position)}
          <mark>{text.slice(position, position + search.length)}</mark>
          {text.slice(position + search.length)}
        </>
      )}
    </div>
  );
}
