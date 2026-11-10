import { Emoji } from "@/components/elements/emoji/Emoji";
import { CountryFlag } from "@/components/elements/flags/CountryFlag";
import { type IEmojiPart } from "@/utils/emoji/text/parts";
import { regionFromFlag } from "@/utils/flags/flag-options";
import { cn } from "@/utils/cn";
export function EmojiPart({ part, isTruncated = false }: { part: IEmojiPart; isTruncated?: boolean }) {
  if (part.isEmoji && regionFromFlag(part.text)) return <CountryFlag value={part.text} />;
  return part.isEmoji ? (
    <Emoji value={part.text} label={part.text} />
  ) : (
    <span className={cn("min-w-0", isTruncated ? "truncate" : "whitespace-pre-wrap wrap-anywhere")}>
      {part.text}
    </span>
  );
}
