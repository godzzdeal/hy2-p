import { styleClass } from "@/styles/runtime";
import { Emoji } from "@/components/elements/emoji/Emoji";
import { useUiStore } from "@/store/ui-store";
import { emojiAsset, leadingEmoji } from "@/utils/emoji/model";
import { useEmojiLabels } from "@/utils/emoji/picker/labels";
import Picker from "emoji-picker-react";
import { useTranslation } from "react-i18next";
const loadRussian = () => import("emoji-picker-react/data/emojis-ru");
const CATEGORY_ICONS = {
  suggested: <Emoji value="🕘" />,
  smileys_people: <Emoji value="😀" />,
  animals_nature: <Emoji value="🐱" />,
  food_drink: <Emoji value="🍕" />,
  travel_places: <Emoji value="🚀" />,
  activities: <Emoji value="🎮" />,
  objects: <Emoji value="💡" />,
  symbols: <Emoji value="❤️" />,
  flags: <Emoji value="🏳️" />,
};
function getEmojiUrl(unified: string): string {
  return emojiAsset(String.fromCodePoint(...unified.split("-").map((part) => Number.parseInt(part, 16))));
}
export function EmojiMenu({ onSelect }: { onSelect: (emoji: string) => void }) {
  const { i18n } = useTranslation();
  const theme = useUiStore((state) => state.theme);
  const labels = useEmojiLabels();
  return (
    <Picker
      unstyled
      className={styleClass("emoji-grid relative inset-auto p-0 w-full min-h-64")}
      width="100%"
      height="100%"
      emojiStyle="twitter"
      colorScheme={theme === "system" ? "auto" : theme}
      emojiVersion="15.0"
      getEmojiUrl={getEmojiUrl}
      emojiData={i18n.language.startsWith("ru") ? loadRussian : undefined}
      labels={labels}
      categoryIcons={CATEGORY_ICONS}
      autoFocusSearch
      lazyLoadEmojis
      previewConfig={{ showPreview: false }}
      onSearchChange={(value) => {
        const pasted = value.trim();
        if (pasted && leadingEmoji(pasted) === pasted) onSelect(pasted);
      }}
      onEmojiClick={(data) => onSelect(data.emoji)}
    />
  );
}
