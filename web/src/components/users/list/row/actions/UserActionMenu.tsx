import { Button } from "@/components/ui/button/Button";
import { MoreHorizontal } from "@/components/elements/icons";
import { UserActionButton } from "@/components/users/list/row/actions/UserActionButton";
import { type IUserAction } from "@/components/users/list/row/actions/UserActions";
import { Popover } from "@/components/ui/overlays/Popover";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
export function UserActionMenu({ actions, name }: { actions: IUserAction[]; name: string }) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const didSelect = useRef(false);
  function onSelected() {
    didSelect.current = true;
    trigger.current?.focus();
    setOpen(false);
  }
  return (
    <Popover
      open={isOpen}
      onOpenChange={(next) => {
        if (next) didSelect.current = false;
        setOpen(next);
      }}
      trigger={
        <Button
          ref={trigger}
          type="button"
          className="user-menu-trigger hidden max-tablet:inline-flex"
          size="icon"
          aria-label={t("Действия ") + name}
          title={t("Действия")}
        >
          <MoreHorizontal width={24} height={24} aria-hidden />
        </Button>
      }
      contentProps={{
        className: "user-action-popup",
        "aria-label": t("Действия ") + name,
        onCloseAutoFocus: (event) => {
          if (didSelect.current) event.preventDefault();
        },
      }}
    >
      <strong className="user-action-title block p-2 wrap-anywhere text-lg text-muted">
        <EmojiText value={name} />
      </strong>
      {actions.map((action) => (
        <UserActionButton key={action.accessibleName} action={action} onSelected={onSelected} />
      ))}
    </Popover>
  );
}
