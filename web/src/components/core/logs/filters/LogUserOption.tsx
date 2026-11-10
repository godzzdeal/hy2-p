import { Button } from "@/components/ui/button/Button";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
interface ILogUserOption {
  name: string;
  id: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
export function LogUserOption({ name, id, isSelected, onSelect }: ILogUserOption) {
  return (
    <Button
      type="button"
      className="log-user-option justify-start text-left h-auto min-h-control p-2 wrap-anywhere"
      variant="outline"
      aria-pressed={isSelected}
      onClick={() => onSelect(id)}
    >
      <EmojiText value={name} />
    </Button>
  );
}
