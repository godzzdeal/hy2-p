import emojiRegex from "emoji-regex";
const PATTERN = emojiRegex();
export function leadingEmoji(value: string): string {
  PATTERN.lastIndex = 0;
  const match = PATTERN.exec(value);
  return match?.index === 0 ? match[0] : "";
}
export function stripEmoji(value: string): string {
  const emoji = leadingEmoji(value);
  return emoji ? value.slice(emoji.length).trimStart() : value;
}
export function replaceEmoji(value: string, emoji: string): string {
  const name = stripEmoji(value);
  return emoji ? emoji + " " + name : name;
}
export function emojiAsset(value: string): string {
  const normalized = value.includes("\u200d") ? value : value.replaceAll("\ufe0f", "");
  return (
    "/emoji/" +
    Array.from(normalized, (character) => character.codePointAt(0)?.toString(16)).join("-") +
    ".svg"
  );
}
