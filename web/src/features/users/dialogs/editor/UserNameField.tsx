import { useId } from "react";
import { useTranslation } from "react-i18next";
import { leadingEmoji, stripEmoji, replaceEmoji, EmojiPicker } from "@/shared/emoji";
export function UserNameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const emoji = leadingEmoji(value);
  return (
    <div className="user-name-fields">
      <label htmlFor={id}>
        {t("Имя")}
        <input
          id={id}
          autoFocus
          required
          maxLength={80}
          value={stripEmoji(value)}
          onChange={(event) =>
            onChange(
              leadingEmoji(event.target.value) ? event.target.value : replaceEmoji(event.target.value, emoji),
            )
          }
        />
      </label>
      <EmojiPicker value={value} onChange={(next) => onChange(replaceEmoji(value, next))} />
      <small className="user-name-hint">
        {t("Эмодзи появится рядом с пользователем и в названии подключения Happ после обновления подписки.")}
        {t("Эмодзи отображается в названии Happ. Отдельной иконкой Happ может сделать только флаг.")}
      </small>
    </div>
  );
}
