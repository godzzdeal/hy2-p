import { useTranslation } from "react-i18next";
import { RefreshCw } from "@/shared/icons";
import { usePanelRelease } from "./use-panel-release";
export function ReleaseStatus() {
  const { t } = useTranslation();
  const release = usePanelRelease();
  const label = t(release.status, { version: release.data?.latest ?? "" });
  return (
    <div className="footer-update">
      <span className="footer-release-status" role="status" aria-live="polite">
        {release.hasUpdate ? (
          <a className="footer-new-release" href={release.data?.url} target="_blank" rel="noreferrer">
            {label}
          </a>
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
        {t("Проверить")}
      </button>
    </div>
  );
}
