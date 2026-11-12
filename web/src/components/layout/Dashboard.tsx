import { Header } from "@/components/layout/header";
import { InstanceSelector } from "@/components/instances/list/InstanceSelector";
import { DemoNotice } from "@/components/demo/DemoNotice";
import { IS_DEMO } from "@/config/build";
import { PanelFooter } from "@/components/layout/footer/PanelFooter";
import { Loader } from "@/components/ui/loading";
import { ScrollNavigation } from "@/components/layout/scroll/ScrollNavigation";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { SpaceScene } from "@/components/layout/SpaceScene";
import { NAVIGATION } from "@/config/navigation";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils/cn";
import { Fragment, Suspense, useRef, type ReactNode } from "react";
import { usePageNavigation } from "@/hooks/layout/use-page-navigation";
import { useTranslation } from "react-i18next";
export function Dashboard({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { page } = usePageNavigation();
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const instanceId = useInstanceId();
  const content = useRef<HTMLDivElement>(null);
  return (
    <div
      className={cn(
        "shell group/app snap-start scroll-m-0 min-h-screen flex max-tablet:flex max-tablet:flex-col max-tablet:h-dvh max-tablet:min-h-0",
        { "sidebar-collapsed": isSidebarCollapsed },
      )}
      data-collapsed={isSidebarCollapsed ? "" : undefined}
    >
      <SpaceScene />
      <Sidebar />
      <main>
        <Header
          title={t(
            page === "core" ? "Управление" : (NAVIGATION.find((item) => item.id === page)?.label ?? ""),
          )}
          hasHysteriaBadge={page === "core"}
        />
        <div
          data-page-content
          className="content relative flex-1 min-h-0 w-full overflow-auto scrollbar-stable snap-proximity scroll-py-4"
          ref={content}
        >
          <div className="page-content min-w-0 w-full max-w-content mx-auto max-tablet:pr-4 max-tablet:pb-4">
            {IS_DEMO && <DemoNotice />}
            <InstanceSelector />
            <Suspense fallback={<Loader label="Загрузка раздела…" />}>
              <Fragment key={instanceId}>{children}</Fragment>
            </Suspense>
          </div>
        </div>
        <ScrollNavigation root={content} page={page} />
        <PanelFooter />
      </main>
    </div>
  );
}
