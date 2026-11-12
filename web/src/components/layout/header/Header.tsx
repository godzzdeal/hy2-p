import { AppearanceControls } from "./AppearanceControls";
import { CurrentUser } from "./CurrentUser";
import { HysteriaBadge } from "@/components/elements/hysteria";

export function Header({ title, hasHysteriaBadge = false }: { title: string; hasHysteriaBadge?: boolean }) {
  return (
    <header className="app-header bg-surface shrink-0 z-10 min-h-header h-header border-b-2 border-line py-0 px-4 flex items-center justify-between gap-4 max-desktop:px-6 max-tablet:px-4 max-tablet:h-0 max-tablet:min-h-0 max-tablet:border-0">
      <div className="breadcrumbs min-w-0 flex items-center gap-2 max-tablet:hidden">
        <span className="truncate">{title}</span>
        {hasHysteriaBadge && <HysteriaBadge />}
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-3">
        <AppearanceControls className="max-tablet:fixed max-tablet:right-16 max-tablet:top-0 max-tablet:z-20" />
        <CurrentUser />
      </div>
    </header>
  );
}
