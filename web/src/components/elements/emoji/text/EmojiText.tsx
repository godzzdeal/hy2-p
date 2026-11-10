import { EmojiPart } from "@/components/elements/emoji/text/EmojiPart";
import { emojiParts } from "@/utils/emoji/text/parts";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

interface IEmojiText extends Omit<ComponentProps<"span">, "children"> {
  value: string;
  isTruncated?: boolean;
}

export function EmojiText({ value, isTruncated = false, className, ...props }: IEmojiText) {
  return (
    <span
      {...props}
      className={cn(
        "emoji-text inline-flex min-w-0 items-center gap-1 align-middle",
        isTruncated ? "flex-nowrap" : "flex-wrap",
        className,
      )}
    >
      {emojiParts(value).map((part) => (
        <EmojiPart key={part.offset} part={part} isTruncated={isTruncated} />
      ))}
    </span>
  );
}
