import { InstanceSelector } from "@/components/instances/list/InstanceSelector";
import { DemoNotice } from "@/components/demo/DemoNotice";
import { IS_DEMO } from "@/config/build";
import { PanelFooter } from "@/components/layout/footer/PanelFooter";
import { Loader } from "@/components/ui/loading";
import { ScrollNavigation } from "@/components/layout/scroll/ScrollNavigation";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { SpaceScene } from "@/components/layout/SpaceScene";
import { NAVIGATION, PageEnum } from "@/config/navigation";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils/cn";
import { lazy, Suspense, useRef } from "react";
import { useTranslation } from "react-i18next";
const InstancesPage = lazy(() =>
  import("@/pages/server/InstancesPage").then((module) => ({ default: module.InstancesPage })),
);
const UsersPage = lazy(() =>
  import("@/pages/UsersPage").then((module) => ({
    default: module.UsersPage,
  })),
);
const ConfigurationPage = lazy(() =>
  import("@/pages/server/ConfigurationPage").then((module) => ({
    default: module.ConfigurationPage,
  })),
);
const CorePage = lazy(() =>
  import("@/pages/server/CorePage").then((module) => ({
    default: module.CorePage,
  })),
);
const OverviewPage = lazy(() =>
  import("@/pages/OverviewPage").then((module) => ({
    default: module.OverviewPage,
  })),
);
const AdminPage = lazy(() =>
  import("@/pages/panel/AdminPage").then((module) => ({ default: module.AdminPage })),
);
const SubscriptionsPage = lazy(() =>
  import("@/pages/panel/SubscriptionsPage").then((module) => ({
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
  instances: InstancesPage,
};
export function Dashboard() {
  const { t } = useTranslation();
  const page = useUiStore((state) => state.page);
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const instanceId = useInstanceId();
  const Page = PAGES[page];
  const content = useRef<HTMLDivElement>(null);
  return (
    <div className={cn("shell", { "sidebar-collapsed": isSidebarCollapsed })}>
      <SpaceScene />
      <Sidebar />
      <main>
        <header className="app-header">
          <div className="breadcrumbs">{t(NAVIGATION.find((item) => item.id === page)?.label ?? "")}</div>
          <span className="admin">{t("Администратор")}</span>
        </header>
        <div className="content" ref={content}>
          <div className="page-content">
            {IS_DEMO && <DemoNotice />}
            <InstanceSelector />
            <Suspense fallback={<Loader label="Загрузка раздела…" />}>
              <Page key={page === "config" || page === "core" || page === "overview" ? instanceId : page} />
            </Suspense>
          </div>
        </div>
        <ScrollNavigation root={content} page={page} />
        <PanelFooter />
      </main>
    </div>
  );
}
