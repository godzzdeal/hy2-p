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
  const { theme, setTheme, isSidebarCollapsed, toggleSidebar } = useUiStore();
  const config = useConfiguration();
  const { logout } = useSession();
  return (
    <aside className="app-sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Earth width={24} height={24} aria-hidden />
        </span>
        <span>HY2-P</span>
        <button
          type="button"
          className="sidebar-toggle icon-btn secondary"
          onClick={toggleSidebar}
          aria-label={t(isSidebarCollapsed ? "Развернуть меню" : "Свернуть меню")}
          title={t(isSidebarCollapsed ? "Развернуть меню" : "Свернуть меню")}
          aria-expanded={!isSidebarCollapsed}
          aria-controls="main-navigation"
        >
          <ChevronRight width={24} height={24} aria-hidden />
        </button>
      </div>
      <div className="workspace">
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
      <div className="aside-bottom">
        <LanguageSelect />
        <label className="theme-control">
          {t("Тема")}
          <Select value={theme} onValueChange={(nextValue) => setTheme(nextValue as typeof theme)}>
            <SelectOption value="system">{t("Системная")}</SelectOption>
            <SelectOption value="light">{t("Светлая")}</SelectOption>
            <SelectOption value="dark">{t("Тёмная")}</SelectOption>
          </Select>
        </label>
        <button aria-label={t("Выйти")} disabled={logout.isPending} onClick={() => logout.mutate()}>
          <LogOut width={24} height={24} aria-hidden />
          <span className="logout-label">{t("Выйти")}</span>
        </button>
      </div>
    </aside>
  );
}
