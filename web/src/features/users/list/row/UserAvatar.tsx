import { UserRound } from "lucide-react";
import { Emoji, leadingEmoji } from "@/shared/emoji";
export function UserAvatar({ name }: { name: string }) {
  const emoji = leadingEmoji(name);
  return (
    <span className="avatar" aria-hidden>
      {emoji ? <Emoji value={emoji} /> : <UserRound size={20} />}
    </span>
  );
}
