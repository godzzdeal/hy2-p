import { UserRound } from "@/shared/icons";
import { Emoji, leadingEmoji } from "@/shared/emoji";
export function UserAvatar({ name }: { name: string }) {
  const emoji = leadingEmoji(name);
  return (
    <span className="avatar" aria-hidden>
      {emoji ? <Emoji value={emoji} /> : <UserRound width={24} height={24} />}
    </span>
  );
}
