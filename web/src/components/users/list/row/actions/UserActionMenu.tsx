import { MoreHorizontal } from "@/components/elements/icons";
import { UserActionButton } from "@/components/users/list/row/actions/UserActionButton";
import { type IUserAction } from "@/components/users/list/row/actions/UserActions";
import * as Popover from "@radix-ui/react-popover";
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
    <Popover.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (next) didSelect.current = false;
        setOpen(next);
      }}
    >
      <Popover.Trigger asChild>
        <button
          ref={trigger}
          type="button"
          className="icon-btn user-menu-trigger"
          aria-label={t("Действия ") + name}
          title={t("Действия")}
        >
          <MoreHorizontal width={24} height={24} aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="user-action-popup"
          aria-label={t("Действия ") + name}
          align="end"
          sideOffset={8}
          collisionPadding={16}
          onCloseAutoFocus={(event) => {
            if (didSelect.current) event.preventDefault();
          }}
        >
          <strong className="user-action-title">{name}</strong>
          {actions.map((action) => (
            <UserActionButton key={action.accessibleName} action={action} onSelected={onSelected} />
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
