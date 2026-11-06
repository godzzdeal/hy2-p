import { SelectOption } from "@/shared/ui/select";
import { Emoji } from "../Emoji";
export function EmojiOption({ value, label }: { value: string; label: string }) {
  return (
    <SelectOption value={value}>
      <span className="flag-name">
        <Emoji value={value} />
        <span>{label}</span>
      </span>
    </SelectOption>
  );
}
