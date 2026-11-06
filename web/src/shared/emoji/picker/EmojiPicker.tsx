import { lazy, Suspense, useId, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useTranslation } from "react-i18next";
import { Sparkles, X } from "@/shared/icons";
import { leadingEmoji } from "../model";
import { Emoji } from "../Emoji";
const EmojiMenu = lazy(() => import("./EmojiMenu").then((module) => ({ default: module.EmojiMenu })));
export function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const emoji = leadingEmoji(value);
  const [isOpen, setOpen] = useState(false);
  function onSelect(next: string) {
    onChange(next);
    setOpen(false);
  }
  return (
    <div className="emoji-picker">
      <label htmlFor={id}>{t("Эмодзи")}</label>
      <Popover.Root open={isOpen} onOpenChange={setOpen} modal>
        <Popover.Trigger asChild>
          <button id={id} type="button" className="secondary emoji-trigger" aria-label={t("Выбрать эмодзи")}>
            {emoji ? <Emoji value={emoji} /> : <Sparkles width={24} height={24} aria-hidden />}
            <span>{t(emoji ? "Изменить эмодзи" : "Выбрать эмодзи")}</span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="emoji-popup"
            aria-label={t("Меню эмодзи")}
            align="end"
            sideOffset={8}
            collisionPadding={16}
          >
            <Suspense fallback={<p role="status">{t("Загружаем эмодзи…")}</p>}>
              <EmojiMenu onSelect={onSelect} />
            </Suspense>
            <div className="emoji-menu-footer">
              <button type="button" className="text-btn" disabled={!emoji} onClick={() => onSelect("")}>
                {t("Убрать эмодзи")}
              </button>
              <Popover.Close className="icon-btn" aria-label={t("Закрыть меню эмодзи")}>
                <X width={24} height={24} aria-hidden />
              </Popover.Close>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
