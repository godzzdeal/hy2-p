import Link from "next/link";
import { buttonStyles } from "@/components/ui/button/button-styles";
import { UserCount } from "@/components/users/list/toolbar/UserCount";
import { PageEnum, PAGE_ROUTES, type NAVIGATION } from "@/config/navigation";
import { usePageNavigation } from "@/hooks/layout/use-page-navigation";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
interface INavigationItem {
  item: (typeof NAVIGATION)[number];
}
export function NavigationItem({ item }: INavigationItem) {
  const { t } = useTranslation();
  const { page, canNavigate } = usePageNavigation();
  return (
    <Link
      href={PAGE_ROUTES[item.id]}
      prefetch={false}
      aria-label={t(item.label)}
      aria-current={page === item.id ? "page" : undefined}
      title={t(item.label)}
      className={cn(
        buttonStyles("ghost", "default"),
        "w-full max-tablet:w-auto justify-start tablet:group-data-collapsed/app:justify-center tablet:group-data-collapsed/app:px-2",
        page === item.id && "selected bg-surface-soft text-accent",
      )}
      onClick={(event) => {
        if (!canNavigate(item.id)) event.preventDefault();
      }}
    >
      <item.icon width={24} height={24} aria-hidden />
      <span className="nav-item-label max-tablet:min-w-0 max-tablet:text-lg max-tablet:wrap-normal max-tablet:whitespace-nowrap">
        {t(item.id === PageEnum.Core ? "Управление" : item.label)}
      </span>
      {item.id === "users" && <UserCount />}
    </Link>
  );
}
