import { Emoji } from "@/components/elements/emoji/Emoji";
import { CountryFlag } from "@/components/elements/flags/CountryFlag";
import { type IEmojiPart } from "@/utils/emoji/text/parts";
import { regionFromFlag } from "@/utils/flags/flag-options";
export function EmojiPart({ part }: { part: IEmojiPart }) {
  if (part.isEmoji && regionFromFlag(part.text)) return <CountryFlag value={part.text} />;
  return part.isEmoji ? <Emoji value={part.text} label={part.text} /> : <>{part.text}</>;
}
