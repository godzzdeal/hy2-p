import { cn } from "@/shared/lib";
import { type IUserAction } from "./UserActions";
export function UserActionButton({
  action,
  isCompact = false,
  onSelected,
}: {
  action: IUserAction;
  isCompact?: boolean;
  onSelected?: () => void;
}) {
  const Icon = action.icon;
  return (
    <button
      type="button"
      className={cn(isCompact ? "icon-btn" : "user-menu-action", { danger: action.isDanger })}
      aria-label={action.accessibleName}
      title={action.label}
      onClick={() => {
        onSelected?.();
        action.onSelect();
      }}
    >
      <Icon width={24} height={24} aria-hidden />
      {!isCompact && <span>{action.label}</span>}
    </button>
  );
}
