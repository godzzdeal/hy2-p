import { useTranslation } from "react-i18next";
import { type NAVIGATION } from "@/app/navigation";
import { useUiStore } from "@/app/state";
import { cn } from "@/shared/lib";
import { UserCount } from "@/features/users/list/toolbar";
interface INavigationItem {
  item: (typeof NAVIGATION)[number];
}
export function NavigationItem({ item }: INavigationItem) {
  const { t } = useTranslation();
  const { page, selectPage } = useUiStore();
  return (
    <button
      aria-label={t(item.label)}
      className={cn({ selected: page === item.id })}
      onClick={() => selectPage(item.id)}
    >
      <item.icon width={24} height={24} aria-hidden />
      <span className="nav-item-label">{t(item.label)}</span>
      {item.id === "users" && <UserCount />}
    </button>
  );
}
