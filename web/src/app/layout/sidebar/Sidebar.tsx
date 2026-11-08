import { Select, SelectOption } from "@/shared/ui/select";
import { useTranslation } from "react-i18next";
import { Earth, LogOut, Server, ChevronRight } from "@/shared/icons";
import { NAVIGATION } from "@/app/navigation";
import { useConfiguration } from "@/features/configuration/model";
import { useSession } from "@/features/session";
import { NavigationItem } from "./NavigationItem";
import { useUiStore } from "@/app/state";
import { LanguageSelect } from "@/shared/i18n";
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
      <span className="nav-label">{t("УПРАВЛЕНИЕ")}</span>
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
