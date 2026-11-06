import { useState } from "react";
import { Sparkles } from "lucide-react";
import { emojiAsset } from "./model";
export function Emoji({ value, label = "" }: { value: string; label?: string }) {
  const [failed, setFailed] = useState("");
  if (!value) return null;
  if (failed === value) return <Sparkles size={24} aria-label={label || undefined} aria-hidden={!label} />;
  return (
    <img
      className="emoji-image"
      src={emojiAsset(value)}
      alt={label}
      width={24}
      height={24}
      onError={() => setFailed(value)}
    />
  );
}
