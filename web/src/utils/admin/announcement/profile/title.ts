import { leadingEmoji, stripEmoji } from "@/utils/emoji/model";
import { FLAG_PREFIX } from "@/utils/flags/flag-options";
export const PROFILE_TITLE_LIMIT = 25;
export interface IProfileTitle {
  flag: string;
  emoji: string;
  name: string;
}
export function parseProfileTitle(value: string): IProfileTitle {
  const flag = value.match(FLAG_PREFIX)?.[0].trim() ?? "";
  const rest = flag ? value.replace(FLAG_PREFIX, "") : value;
  return { flag, emoji: leadingEmoji(rest), name: stripEmoji(rest) };
}
export function formatProfileTitle(value: IProfileTitle): string {
  return [value.flag, value.emoji, value.name].filter(Boolean).join(" ");
}
export function renameProfileTitle(current: string, next: string): string {
  const previous = parseProfileTitle(current);
  const pasted = parseProfileTitle(next);
  return formatProfileTitle({
    flag: pasted.flag || previous.flag,
    emoji: pasted.emoji || previous.emoji,
    name: pasted.name,
  });
}
