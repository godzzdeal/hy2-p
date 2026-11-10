import { EmojiPart } from "@/components/elements/emoji/text/EmojiPart";
import { emojiParts } from "@/utils/emoji/text/parts";
export function EmojiText({ value }: { value: string }) {
  return (
    <span className="emoji-text inline-flex min-w-0 flex-wrap items-center gap-1 align-middle leading-snug">
      {emojiParts(value).map((part) => (
        <EmojiPart key={part.offset} part={part} />
      ))}
    </span>
  );
}
