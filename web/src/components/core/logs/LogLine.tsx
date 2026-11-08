import { cn } from "@/utils/cn";
export function LogLine({ text, search }: { text: string; search: string }) {
  const position = search ? text.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) : -1;
  return (
    <div
      className={cn("log-line", {
        "log-error": /\b(ERROR|FATAL|PANIC)\b/i.test(text),
        "log-warning": /\bWARN(?:ING)?\b/i.test(text),
      })}
    >
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
