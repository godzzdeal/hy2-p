import { EmojiPart } from "@/components/elements/emoji/text/EmojiPart";
import { emojiParts } from "@/utils/emoji/text/parts";
export function EmojiText({ value }: { value: string }) {
  return (
    <span className="emoji-text">
      {emojiParts(value).map((part) => (
        <EmojiPart key={part.offset} part={part} />
      ))}
    </span>
  );
}
