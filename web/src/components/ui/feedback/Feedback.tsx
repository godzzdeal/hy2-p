import { Notification } from "@/components/ui/feedback/Notification";
import { useNotifications } from "@/store/notifications";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
export function Feedback({ children, className, ...props }: ComponentProps<"div">) {
  const items = useNotifications((state) => state.items);
  return (
    <div {...props} className={cn("notifications", className)}>
      {children}
      {items.map((item) => (
        <Notification key={item.id} item={item} />
      ))}
    </div>
  );
}
