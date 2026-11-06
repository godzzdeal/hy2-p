import { Select, SelectOption } from "@/shared/ui/select";
import { useTranslation } from "react-i18next";
import { Earth, LogOut, Server } from "@/shared/icons";
import { NAVIGATION } from "@/app/navigation";
import { useConfiguration } from "@/features/configuration/model";
import { useSession } from "@/features/session";
import { BuildVersion } from "./BuildVersion";
import { NavigationItem } from "./NavigationItem";
import { useUiStore } from "@/app/state";
import { LanguageSelect } from "@/shared/i18n";
export function Sidebar() {
  const { t } = useTranslation();
  const { theme, setTheme } = useUiStore();
  const config = useConfiguration();
  const { logout } = useSession();
  return (
    <aside className="app-sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Earth width={24} height={24} aria-hidden />
        </span>
        <span>HY2-P</span>
      </div>
      <div className="workspace">
        <Server width={24} height={24} aria-hidden />
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
          <Select value={theme} onValueChange={(nextValue) => setTheme(nextValue as typeof theme)}>
            <SelectOption value="system">{t("Системная")}</SelectOption>
            <SelectOption value="light">{t("Светлая")}</SelectOption>
            <SelectOption value="dark">{t("Тёмная")}</SelectOption>
          </Select>
        </label>
        <div className="version">
          <span className="status-dot" />
          HY2-P <BuildVersion />
        </div>
        <button aria-label={t("Выйти")} disabled={logout.isPending} onClick={() => logout.mutate()}>
          <LogOut width={24} height={24} aria-hidden />
          <span className="logout-label">{t("Выйти")}</span>
        </button>
      </div>
    </aside>
  );
}
