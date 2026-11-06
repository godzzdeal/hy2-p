import { Emoji } from "../Emoji";
import { type IEmojiPart } from "./parts";
export function EmojiPart({ part }: { part: IEmojiPart }) {
  return part.isEmoji ? <Emoji value={part.text} /> : <>{part.text}</>;
}
