import { Notification } from "@/components/ui/feedback/Notification";
import { useNotifications } from "@/store/notifications";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
export function Feedback({ children, className, ...props }: ComponentProps<"div">) {
  const items = useNotifications((state) => state.items);
  return (
    <div
      {...props}
      className={cn("notifications overflow-y-auto fixed grid gap-3 z-50 pointer-events-none", className)}
    >
      {children}
      {items.map((item) => (
        <Notification key={item.id} item={item} />
      ))}
    </div>
  );
}
