import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { UserAvatar } from "@/components/users/list/row/UserAvatar";
import { type IUser } from "@/services/users/user-types";
import { FLAG_PREFIX } from "@/utils/flags/flag-options";
import { useTranslation } from "react-i18next";

interface IMemberRow {
  user: IUser;
  groupName?: string;
  isChecked: boolean;
  onToggle: (id: string, isChecked: boolean) => void;
}
export function MemberRow({ user, groupName, isChecked, onToggle }: IMemberRow) {
  const { t } = useTranslation();
  return (
    <Field
      className="group-member-row m-0 grid min-h-16 grid-cols-member items-center gap-3 border-2 border-line bg-input px-3 py-2 hover:border-accent has-checked:border-accent has-checked:bg-surface-soft focus-within:outline-2 focus-within:-outline-offset-4 focus-within:outline-accent"
      isInline
    >
      <Input
        type="checkbox"
        checked={isChecked}
        aria-label={t("Выбрать {{name}}", { name: user.displayName ?? user.name })}
        onChange={(event) => onToggle(user.id, event.target.checked)}
      />
      <UserAvatar name={user.displayName ?? user.name} />
      <span className="group-member-info grid gap-1 min-w-0">
        <strong className="group-member-name block wrap-anywhere font-medium leading-normal">
          <EmojiText value={(user.displayName ?? user.name).replace(FLAG_PREFIX, "")} />
        </strong>
        <small className="group-member-group">{groupName ?? t("Без группы")}</small>
      </span>
    </Field>
  );
}
