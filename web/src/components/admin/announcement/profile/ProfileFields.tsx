import { EmojiPicker } from "@/components/elements/emoji/picker/EmojiPicker";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { PROFILE_TITLE_LIMIT } from "@/utils/admin/announcement/profile/title";
import { leadingEmoji, replaceEmoji } from "@/utils/emoji/model";
import { useId } from "react";
import { useTranslation } from "react-i18next";
export function ProfileFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const count = Array.from(value).length;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label htmlFor={id}>
        {t("Название подписки")}
        <input
          id={id}
          aria-label={t("Название подписки")}
          aria-invalid={count > PROFILE_TITLE_LIMIT}
          value={value}
          placeholder={t("Например, Германия")}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={id + "-hint"}
        />
        <small id={id + "-hint"}>
          {count} / {PROFILE_TITLE_LIMIT}
        </small>
        <small>{t("Название появится в приложении после обновления подписки. Можно добавить эмодзи.")}</small>
      </label>
      <EmojiPicker value={leadingEmoji(value)} onChange={(emoji) => onChange(replaceEmoji(value, emoji))} />
      <div className="subscription-preview md:col-span-2">
        <small>{t("Предпросмотр названия подписки")}</small>
        <output aria-label={t("Предпросмотр названия подписки")}>
          <EmojiText value={value || t("Название подписки")} />
        </output>
      </div>
    </div>
  );
}
