import { Caption } from "@/components/elements/Caption";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/fields/controls/Input";
import { Pagination } from "@/components/ui/Pagination";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { ChevronDown } from "@/components/elements/icons";
import { LogUserOption } from "@/components/core/logs/filters/LogUserOption";
import { useLogUsers } from "@/hooks/core/logs/use-log-users";
import { type IUser } from "@/services/users/user-types";
import { Popover } from "@/components/ui/overlays/Popover";
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
    <Popover
      open={isOpen}
      onOpenChange={setOpen}
      trigger={
        <Button
          type="button"
          className="log-user-trigger max-w-full gap-2"
          variant="secondary"
          aria-label={t("Пользователь в журнале")}
        >
          <EmojiText value={selected ? (selected.displayName ?? selected.name) : t("Все пользователи")} />
          <ChevronDown width={24} height={24} aria-hidden />
        </Button>
      }
      contentProps={{ className: "log-user-picker", "aria-label": t("Выбрать пользователя") }}
    >
      <Input
        type="search"
        aria-label={t("Поиск пользователя")}
        placeholder={t("Поиск по имени…")}
        value={model.search}
        onChange={(event) => model.onSearch(event.target.value)}
      />
      <LogUserOption name={t("Все пользователи")} id="" isSelected={!userId} onSelect={onSelect} />
      <div className="log-user-options max-h-80 overflow-y-auto grid">
        {model.visible.map((user) => (
          <LogUserOption
            key={user.id}
            name={user.displayName ?? user.name}
            id={user.id}
            isSelected={user.id === userId}
            onSelect={onSelect}
          />
        ))}
        {!model.visible.length && <Caption>{t("Ничего не найдено.")}</Caption>}
      </div>
      <Pagination page={model.page} pageCount={model.pageCount} onChange={model.setPage} />
    </Popover>
  );
}
