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
    <label className="checkbox group-member-row">
      <input
        type="checkbox"
        checked={isChecked}
        aria-label={t("Выбрать {{name}}", { name: user.displayName ?? user.name })}
        onChange={(event) => onToggle(user.id, event.target.checked)}
      />
      <UserAvatar name={user.displayName ?? user.name} />
      <span className="group-member-info">
        <strong className="group-member-name">
          <EmojiText value={(user.displayName ?? user.name).replace(FLAG_PREFIX, "")} />
        </strong>
        <small className="group-member-group">{groupName ?? t("Без группы")}</small>
      </span>
    </label>
  );
}
