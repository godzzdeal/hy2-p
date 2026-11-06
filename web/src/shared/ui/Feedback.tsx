import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Check, X } from "@/shared/icons";
import { NETWORK } from "@/shared/http";
import { useUiStore } from "@/app/state";
export function Feedback() {
  const { t } = useTranslation();
  const { error, notice, clearError, clearNotice } = useUiStore();
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(clearNotice, NETWORK.noticeMs);
    return () => clearTimeout(timer);
  }, [notice, clearNotice]);
  return (
    <>
      {error && (
        <div className="alert global-error" role="alert">
          {t(error)}
          <button aria-label={t("Закрыть ошибку")} onClick={clearError}>
            <X width={24} height={24} aria-hidden />
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check width={24} height={24} aria-hidden />
          {t(notice)}
        </div>
      )}
    </>
  );
}
