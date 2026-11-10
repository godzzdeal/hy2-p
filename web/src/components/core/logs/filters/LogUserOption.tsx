import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
interface ILogUserOption {
  name: string;
  id: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
export function LogUserOption({ name, id, isSelected, onSelect }: ILogUserOption) {
  return (
    <button
      type="button"
      className="text-btn log-user-option"
      aria-pressed={isSelected}
      onClick={() => onSelect(id)}
    >
      <EmojiText value={name} />
    </button>
  );
}
