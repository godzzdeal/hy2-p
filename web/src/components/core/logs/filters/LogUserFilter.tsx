import { Pagination } from "@/components/ui/Pagination";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { ChevronDown } from "@/components/elements/icons";
import { LogUserOption } from "@/components/core/logs/filters/LogUserOption";
import { useLogUsers } from "@/hooks/core/logs/use-log-users";
import { type IUser } from "@/services/users/user-types";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface ILogUserFilter {
  users: readonly IUser[];
  userId: string;
  onUser: (value: string) => void;
}
export function LogUserFilter({ users, userId, onUser }: ILogUserFilter) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const model = useLogUsers(users);
  const selected = users.find((user) => user.id === userId);
  function onSelect(value: string) {
    onUser(value);
    setOpen(false);
  }
  return (
    <Popover.Root open={isOpen} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className="secondary log-user-trigger" aria-label={t("Пользователь в журнале")}>
          <EmojiText value={selected ? (selected.displayName ?? selected.name) : t("Все пользователи")} />
          <ChevronDown width={24} height={24} aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="log-user-picker"
          sideOffset={8}
          collisionPadding={16}
          aria-label={t("Выбрать пользователя")}
        >
          <input
            type="search"
            aria-label={t("Поиск пользователя")}
            placeholder={t("Поиск по имени…")}
            value={model.search}
            onChange={(event) => model.onSearch(event.target.value)}
          />
          <LogUserOption name={t("Все пользователи")} id="" isSelected={!userId} onSelect={onSelect} />
          <div className="log-user-options">
            {model.visible.map((user) => (
              <LogUserOption
                key={user.id}
                name={user.displayName ?? user.name}
                id={user.id}
                isSelected={user.id === userId}
                onSelect={onSelect}
              />
            ))}
            {!model.visible.length && <p className="caption">{t("Ничего не найдено.")}</p>}
          </div>
          <Pagination page={model.page} pageCount={model.pageCount} onChange={model.setPage} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
