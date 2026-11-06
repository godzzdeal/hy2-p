import { useTranslation } from "react-i18next";
import { ScrollNavigation } from "./scroll";
import { lazy, Suspense, useRef } from "react";
import { NAVIGATION, PageEnum } from "@/app/navigation";
import { useUiStore } from "@/app/state";
import { Sidebar } from "./Sidebar";
const UsersPage = lazy(() =>
  import("@/features/users/list").then((module) => ({
    default: module.UsersPage,
  })),
);
const ConfigurationPage = lazy(() =>
  import("@/features/configuration").then((module) => ({
    default: module.ConfigurationPage,
  })),
);
const CorePage = lazy(() =>
  import("@/features/core/CorePage").then((module) => ({
    default: module.CorePage,
  })),
);
const OverviewPage = lazy(() =>
  import("@/features/overview/OverviewPage").then((module) => ({
    default: module.OverviewPage,
  })),
);
const AdminPage = lazy(() => import("@/features/admin").then((module) => ({ default: module.AdminPage })));
const SubscriptionsPage = lazy(() =>
  import("@/features/subscriptions/SubscriptionsPage").then((module) => ({
    default: module.SubscriptionsPage,
  })),
);
const PAGES = {
  [PageEnum.Subscriptions]: SubscriptionsPage,
  admin: AdminPage,
  overview: OverviewPage,
  users: UsersPage,
  config: ConfigurationPage,
  core: CorePage,
};
export function Dashboard() {
  const { t } = useTranslation();
  const page = useUiStore((state) => state.page);
  const Page = PAGES[page];
  const content = useRef<HTMLDivElement>(null);
  return (
    <div className="shell">
      <Sidebar />
      <main>
        <header>
          <div className="breadcrumbs">
            {t("Панель управления /")} {t(NAVIGATION.find((item) => item.id === page)?.label ?? "")}
          </div>
          <span className="admin">{t("Администратор")}</span>
        </header>
        <div className="content" ref={content}>
          <Suspense fallback={<p role="status">{t("Загрузка раздела\u2026")}</p>}>
            <Page />
          </Suspense>
          <footer>
            <span>HY2 / CONTROL</span>
            <span>Hysteria 2</span>
          </footer>
        </div>
      </main>
      <ScrollNavigation root={content} page={page} />
    </div>
  );
}
