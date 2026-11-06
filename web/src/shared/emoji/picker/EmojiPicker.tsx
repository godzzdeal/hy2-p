import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectOption } from "@/shared/ui/select";
import { leadingEmoji } from "../model";
import { Emoji } from "../Emoji";
import { EmojiOption } from "./EmojiOption";
import { EMOJIS } from "./presets";
export function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const emoji = leadingEmoji(value);
  const [custom, setCustom] = useState("");
  const isInvalid = custom !== "" && leadingEmoji(custom.trim()) !== custom.trim();
  function onCustom(next: string) {
    setCustom(next);
    const candidate = next.trim();
    if (!candidate || leadingEmoji(candidate) === candidate) onChange(candidate);
  }
  return (
    <div className="emoji-picker">
      <label htmlFor={id}>
        {t("Эмодзи")}
        <Select
          id={id}
          value={emoji}
          onValueChange={(next) => {
            setCustom("");
            onChange(next);
          }}
        >
          <SelectOption value="">{t("Без эмодзи")}</SelectOption>
          {emoji && !EMOJIS.some((option) => option.value === emoji) && (
            <EmojiOption value={emoji} label={t("Свой эмодзи")} />
          )}
          {EMOJIS.map((option) => (
            <EmojiOption key={option.value} value={option.value} label={t(option.label)} />
          ))}
        </Select>
      </label>
      <label htmlFor={id + "-custom"}>
        {t("Или вставьте свой")}
        <div className="custom-emoji">
          <input
            id={id + "-custom"}
            aria-label={t("Свой эмодзи")}
            maxLength={32}
            value={custom}
            aria-invalid={isInvalid}
            placeholder={t("Один эмодзи")}
            onChange={(event) => onCustom(event.target.value)}
          />
          <Emoji value={emoji} />
        </div>
      </label>
      {isInvalid && <small role="alert">{t("Вставьте один эмодзи без текста.")}</small>}
    </div>
  );
}
