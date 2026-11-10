import { Field } from "@/components/ui/fields/Field";
import { Button } from "@/components/ui/button/Button";
import { Emoji } from "@/components/elements/emoji/Emoji";
import { Sparkles, X } from "@/components/elements/icons";
import { leadingEmoji } from "@/utils/emoji/model";
import { Loader } from "@/components/ui/loading";
import { Popover } from "@/components/ui/overlays/Popover";
import { lazy, Suspense, useId, useState } from "react";
import { useTranslation } from "react-i18next";
const EmojiMenu = lazy(() =>
  import("@/components/elements/emoji/picker/EmojiMenu").then((module) => ({ default: module.EmojiMenu })),
);
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
    <div className="emoji-picker self-start">
      <Field htmlFor={id} className="mb-2">
        {t("Эмодзи")}
      </Field>
      <Popover
        open={isOpen}
        onOpenChange={setOpen}
        modal
        trigger={
          <Button
            id={id}
            type="button"
            className="emoji-trigger w-full justify-start"
            variant="secondary"
            aria-label={t("Выбрать эмодзи")}
          >
            {emoji ? <Emoji value={emoji} /> : <Sparkles width={24} height={24} aria-hidden />}
            <span>{t(emoji ? "Изменить эмодзи" : "Выбрать эмодзи")}</span>
          </Button>
        }
        contentProps={{ className: "emoji-popup", "aria-label": t("Меню эмодзи") }}
      >
        <Suspense fallback={<Loader label="Загружаем эмодзи…" />}>
          <EmojiMenu onSelect={onSelect} />
        </Suspense>
        <div className="emoji-menu-footer flex items-center justify-between py-2 px-3 border-line">
          <Button type="button" variant="outline" disabled={!emoji} onClick={() => onSelect("")}>
            {t("Убрать эмодзи")}
          </Button>
          <Button
            type="button"
            size="icon"
            aria-label={t("Закрыть меню эмодзи")}
            onClick={() => setOpen(false)}
          >
            <X width={24} height={24} aria-hidden />
          </Button>
        </div>
      </Popover>
    </div>
  );
}
