import { Button } from "@/components/ui/button/Button";
import { type IUserAction } from "@/components/users/list/row/actions/UserActions";
import { cn } from "@/utils/cn";
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
    <Button
      type="button"
      className={cn(
        !isCompact && "user-menu-action w-full h-auto min-h-12 justify-start p-2 text-left text-lg",
      )}
      size={isCompact ? "icon" : "default"}
      variant={action.isDanger ? "danger" : "ghost"}
      aria-label={action.accessibleName}
      title={action.label}
      onClick={() => {
        onSelected?.();
        action.onSelect();
      }}
    >
      <Icon width={24} height={24} aria-hidden />
      {!isCompact && <span>{action.label}</span>}
    </Button>
  );
}
