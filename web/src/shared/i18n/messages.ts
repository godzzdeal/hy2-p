import { ENGLISH } from "./english";
const PREFIXES = Object.entries(ENGLISH)
  .filter(([key]) => key.endsWith(" ") && key.length > 8)
  .sort(([left], [right]) => right.length - left.length);
const FORMATS = Object.entries(ENGLISH)
  .filter(([key]) => /%[dvswq]/.test(key))
  .map(([key, value]) => {
    const pattern = key
      .split(/%[dvswq]/)
      .map((part) => part.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&"))
      .join("(.+?)");
    return { expression: new RegExp("^" + pattern + "$"), value };
  });
export function translateFallback(message: string): string {
  for (const entry of FORMATS) {
    const matches = message.match(entry.expression);
    if (matches) {
      let index = 0;
      return entry.value.replace(/%[dvswq]/g, () => matches[++index]);
    }
  }
  for (const [prefix, translated] of PREFIXES) {
    if (message.startsWith(prefix)) return translated + message.slice(prefix.length);
  }
  return message;
}
