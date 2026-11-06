import { emojiParts } from "./parts";
import { EmojiPart } from "./EmojiPart";
export function EmojiText({ value }: { value: string }) {
  return (
    <span className="emoji-text">
      {emojiParts(value).map((part) => (
        <EmojiPart key={part.offset} part={part} />
      ))}
    </span>
  );
}
