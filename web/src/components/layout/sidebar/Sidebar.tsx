import { Button } from "@/components/ui/button/Button";
import { Field } from "@/components/ui/fields/Field";
import { ChevronRight, Earth, LogOut, Server } from "@/components/elements/icons";
import { LanguageSelect } from "@/components/elements/LanguageSelect";
import { NavigationItem } from "@/components/layout/sidebar/NavigationItem";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { NAVIGATION } from "@/config/navigation";
import { useConfiguration } from "@/hooks/configuration/use-configuration";
import { useSession } from "@/hooks/session/use-session";
import { useUiStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";
export function Sidebar() {
  const { t } = useTranslation();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const config = useConfiguration();
  const { logout } = useSession();
  return (
    <aside className="app-sidebar max-tablet:shrink-0 max-tablet:relative max-tablet:w-full max-tablet:border-r-0 max-tablet:border-b-2 max-tablet:border-line fixed w-sidebar bg-surface border-r-2 border-line flex flex-col">
      <div className="brand max-tablet:text-2xl flex items-center gap-3 text-2xl font-bold h-header min-h-header">
        <span className="brand-mark shadow-pixel grid place-items-center w-8 h-8 rounded-none text-accent-text bg-accent tablet:group-data-collapsed/app:hidden">
          <Earth width={24} height={24} aria-hidden />
        </span>
        <span className="tablet:group-data-collapsed/app:hidden">HY2-P</span>
        <Button
          type="button"
          className="sidebar-toggle ml-auto max-tablet:hidden tablet:group-data-collapsed/app:mx-auto"
          variant="secondary"
          size="icon"
          onClick={toggleSidebar}
          aria-label={t(isSidebarCollapsed ? "Развернуть меню" : "Свернуть меню")}
          title={t(isSidebarCollapsed ? "Развернуть меню" : "Свернуть меню")}
          aria-expanded={!isSidebarCollapsed}
          aria-controls="main-navigation"
        >
          <ChevronRight width={24} height={24} aria-hidden />
        </Button>
      </div>
      <div className="workspace flex items-center gap-3 py-3 my-3 mx-0 bg-surface-soft px-3 max-tablet:hidden tablet:group-data-collapsed/app:hidden">
        <Server width={24} height={24} aria-hidden />
        <div>
          <strong>{t("Мой сервер")}</strong>
          <small>{config.data?.host || t("Адрес не настроен")}</small>
        </div>
      </div>
      <nav id="main-navigation">
        {NAVIGATION.map((item) => (
          <NavigationItem key={item.id} item={item} />
        ))}
      </nav>
      <div className="aside-bottom max-tablet:grid max-tablet:grid-cols-2 max-tablet:items-center max-tablet:gap-3 max-tablet:pt-3 mt-auto pt-4">
        <LanguageSelect />
        <Field className="theme-control max-tablet:m-0 max-tablet:flex-1 max-tablet:min-w-0 my-4 mx-0 tablet:group-data-collapsed/app:hidden">
          {t("Тема")}
          <Select value={theme} onValueChange={(nextValue) => setTheme(nextValue as typeof theme)}>
            <SelectOption value="system">{t("Системная")}</SelectOption>
            <SelectOption value="light">{t("Светлая")}</SelectOption>
            <SelectOption value="dark">{t("Тёмная")}</SelectOption>
          </Select>
        </Field>
        <Button
          className="w-full justify-start max-tablet:w-control max-tablet:justify-center max-tablet:px-0 tablet:group-data-collapsed/app:justify-center tablet:group-data-collapsed/app:px-2"
          aria-label={t("Выйти")}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut width={24} height={24} aria-hidden />
          <span className="logout-label">{t("Выйти")}</span>
        </Button>
      </div>
    </aside>
  );
}
