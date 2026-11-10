import { Button } from "@/components/ui/button/Button";
import { RefreshCw } from "@/components/elements/icons";
import { usePanelRelease } from "@/hooks/layout/footer/use-panel-release";
import { useTranslation } from "react-i18next";
import { lazy, Suspense, useState } from "react";
import { Loader } from "@/components/ui/loading";
const PanelUpdateDialog = lazy(() =>
  import("@/components/panel/maintenance/PanelUpdateDialog").then((module) => ({
    default: module.PanelUpdateDialog,
  })),
);
export function ReleaseStatus() {
  const { t } = useTranslation();
  const release = usePanelRelease();
  const [isOpen, setOpen] = useState(false);
  const label = t(release.status, { version: release.data?.latest ?? "" });
  return (
    <>
      <div className="footer-update flex items-center justify-end flex-wrap gap-2 min-w-0 max-desktop:col-span-full max-desktop:row-start-2 max-desktop:justify-between max-tablet:grid max-tablet:grid-cols-action">
        <span className="footer-release-status min-w-0 wrap-anywhere" role="status" aria-live="polite">
          {release.hasUpdate ? (
            <Button
              type="button"
              className="footer-new-release px-0 text-accent h-auto min-h-control text-left font-bold"
              variant="outline"
              onClick={() => setOpen(true)}
              aria-label={t("Обновить панель")}
            >
              {label}
            </Button>
          ) : (
            label
          )}
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={release.onCheck}
          disabled={release.isFetching}
          aria-label={t("Проверить обновления панели")}
        >
          <RefreshCw width={24} height={24} aria-hidden />
          <span className="footer-check-label max-tablet:hidden">{t("Проверить")}</span>
        </Button>
      </div>
      {isOpen && (
        <Suspense fallback={<Loader isInline />}>
          <PanelUpdateDialog onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
