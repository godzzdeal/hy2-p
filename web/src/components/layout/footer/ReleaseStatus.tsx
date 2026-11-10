import { RefreshCw } from "@/components/elements/icons";
import { usePanelRelease } from "@/hooks/layout/footer/use-panel-release";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { PanelUpdateDialog } from "@/components/panel/maintenance";
export function ReleaseStatus() {
  const { t } = useTranslation();
  const release = usePanelRelease();
  const [isOpen, setOpen] = useState(false);
  const label = t(release.status, { version: release.data?.latest ?? "" });
  return (
    <>
      <div className="footer-update">
        <span className="footer-release-status" role="status" aria-live="polite">
          {release.hasUpdate ? (
            <button
              type="button"
              className="footer-new-release text-btn"
              onClick={() => setOpen(true)}
              aria-label={t("Обновить панель")}
            >
              {label}
            </button>
          ) : (
            label
          )}
        </span>
        <button
          type="button"
          className="secondary"
          onClick={release.onCheck}
          disabled={release.isFetching}
          aria-label={t("Проверить обновления панели")}
        >
          <RefreshCw width={24} height={24} aria-hidden />
          <span className="footer-check-label">{t("Проверить")}</span>
        </button>
      </div>
      {isOpen && <PanelUpdateDialog onClose={() => setOpen(false)} />}
    </>
  );
}
