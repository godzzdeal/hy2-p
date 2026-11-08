import { EmojiPicker } from "@/components/elements/emoji/picker/EmojiPicker";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { FlagPicker } from "@/components/elements/flags/select/FlagPicker";
import {
  PROFILE_TITLE_LIMIT,
  formatProfileTitle,
  parseProfileTitle,
  renameProfileTitle,
} from "@/utils/admin/announcement/profile/title";
import { useId } from "react";
import { useTranslation } from "react-i18next";
export function ProfileFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const parts = parseProfileTitle(value);
  const count = Array.from(value).length;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="md:col-span-2" htmlFor={id}>
        {t("Название подписки")}
        <input
          id={id}
          aria-label={t("Название подписки")}
          aria-invalid={count > PROFILE_TITLE_LIMIT}
          value={parts.name}
          placeholder={t("Например, Германия")}
          onChange={(event) => onChange(renameProfileTitle(value, event.target.value))}
          aria-describedby={id + "-hint"}
        />
        <small id={id + "-hint"}>
          {count} / {PROFILE_TITLE_LIMIT}
        </small>
        <small>
          {t("Название появится в Happ после обновления подписки. Можно вставить свой флаг или эмодзи.")}
        </small>
      </label>
      <FlagPicker value={parts.flag} onChange={(flag) => onChange(formatProfileTitle({ ...parts, flag }))} />
      <EmojiPicker
        value={parts.emoji}
        onChange={(emoji) => onChange(formatProfileTitle({ ...parts, emoji }))}
      />
      <div className="subscription-preview md:col-span-2">
        <small>{t("Предпросмотр названия подписки")}</small>
        <output aria-label={t("Предпросмотр названия подписки")}>
          <EmojiText value={value || t("Название подписки")} />
        </output>
      </div>
    </div>
  );
}
