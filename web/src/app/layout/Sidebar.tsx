import { useTranslation } from "react-i18next";
import { Activity, LogOut, Server } from "lucide-react";
import { NAVIGATION } from "@/app/navigation";
import { useConfiguration } from "@/features/configuration/model";
import { useSession } from "@/features/session";
import { NavigationItem } from "./NavigationItem";
import { useUiStore } from "@/app/state";
import { LanguageSelect } from "@/shared/i18n";
export function Sidebar() {
  const { t } = useTranslation();
  const { theme, setTheme } = useUiStore();
  const config = useConfiguration();
  const { logout } = useSession();
  return (
    <aside>
      <div className="brand">
        <span className="brand-mark">
          <Activity size={24} aria-hidden />
        </span>
        <span>
          HY2<span className="brand-sub">CONTROL PANEL</span>
        </span>
      </div>
      <div className="workspace">
        <Server size={20} aria-hidden />
        <div>
          <strong>{t("Мой сервер")}</strong>
          <small>{config.data?.host || t("Адрес не настроен")}</small>
        </div>
      </div>
      <span className="nav-label">{t("УПРАВЛЕНИЕ")}</span>
      <nav>
        {NAVIGATION.map((item) => (
          <NavigationItem key={item.id} item={item} />
        ))}
      </nav>
      <div className="aside-bottom">
        <LanguageSelect />
        <label className="theme-control">
          {t("Тема")}
          <select value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)}>
            <option value="system">{t("Системная")}</option>
            <option value="light">{t("Светлая")}</option>
            <option value="dark">{t("Тёмная")}</option>
          </select>
        </label>
        <div className="version">
          <span className="status-dot" />
          HY2 Control <span className="muted">v0.1</span>
        </div>
        <button disabled={logout.isPending} onClick={() => logout.mutate()}>
          <LogOut size={20} aria-hidden />
          {t("Выйти")}
        </button>
      </div>
    </aside>
  );
}
