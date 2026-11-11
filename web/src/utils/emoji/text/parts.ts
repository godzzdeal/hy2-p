import emojiRegex from "emoji-regex";
export interface IEmojiPart {
  text: string;
  isEmoji: boolean;
  offset: number;
}
export function emojiParts(value: string): IEmojiPart[] {
  const parts: IEmojiPart[] = [];
  let offset = 0;
  for (const match of value.matchAll(emojiRegex())) {
    if (match.index > offset)
      parts.push({
        text: value.slice(offset, match.index),
        isEmoji: false,
        offset,
      });
    parts.push({ text: match[0], isEmoji: true, offset: match.index });
    offset = match.index + match[0].length;
  }
  if (offset < value.length) parts.push({ text: value.slice(offset), isEmoji: false, offset });
  return parts;
}
