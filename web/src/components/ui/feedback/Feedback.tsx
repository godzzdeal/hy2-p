import { Notification } from "@/components/ui/feedback/Notification";
import { useNotifications } from "@/store/notifications";
export function Feedback() {
  const items = useNotifications((state) => state.items);
  return (
    <div className="notifications">
      {items.map((item) => (
        <Notification key={item.id} item={item} />
      ))}
    </div>
  );
}
