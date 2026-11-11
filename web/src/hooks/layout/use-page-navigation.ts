"use client";
import { usePathname, useRouter } from "next/navigation";
import { PAGE_ROUTES, type TPage } from "@/config/navigation";
import { useUiStore } from "@/store/ui-store";
import { i18n } from "@/config/i18n/setup";

export function usePageNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const page =
    (Object.keys(PAGE_ROUTES) as TPage[]).find((key) => PAGE_ROUTES[key] === pathname) ?? "overview";
  function canNavigate(next: TPage): boolean {
    return (
      next === page ||
      !useUiStore.getState().hasUnsavedConfiguration ||
      window.confirm(i18n.t("Есть несохранённые изменения. Уйти без сохранения?"))
    );
  }
  function selectPage(next: TPage): void {
    if (canNavigate(next)) router.push(PAGE_ROUTES[next]);
  }
  return { page, selectPage, canNavigate };
}
