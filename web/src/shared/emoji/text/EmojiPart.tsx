import { Emoji } from "../Emoji";
import { CountryFlag, regionFromFlag } from "@/shared/flags";
import { type IEmojiPart } from "./parts";
export function EmojiPart({ part }: { part: IEmojiPart }) {
  if (part.isEmoji && regionFromFlag(part.text)) return <CountryFlag value={part.text} />;
  return part.isEmoji ? <Emoji value={part.text} label={part.text} /> : <>{part.text}</>;
}
