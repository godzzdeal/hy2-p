import { UpdateConfirmation } from "@/components/core/UpdateConfirmation";
import { ReleaseOption } from "@/components/core/versions/ReleaseOption";
import { UpdateProgress } from "@/components/core/versions/UpdateProgress";
import { Download, RefreshCw, Undo2 } from "@/components/elements/icons";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useReleaseVersions, useUpdateStatus } from "@/hooks/core/updates/use-updates";
import { normalizeVersion } from "@/utils/core/version";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function UpdateCard() {
  const { t } = useTranslation();
  const versions = useReleaseVersions();
  const status = useUpdateStatus();
  const [selected, setSelected] = useState("");
  const [confirmation, setConfirmation] = useState<"install" | "rollback" | null>(null);
  const latest = versions.data?.find((release) => release.available)?.tag ?? "";
  const current = status.data?.current ?? "";
  const version = selected || latest || current;
  const isCurrent = !!current && normalizeVersion(version) === normalizeVersion(current);
  const isLatest = !!latest && normalizeVersion(latest) === normalizeVersion(current);
  const isBusy = status.data?.busy === true;
  const canInstall =
    !!status.data &&
    !isBusy &&
    !isCurrent &&
    versions.data?.some((release) => release.available && release.tag === version);
  const previous = normalizeVersion(status.data?.previous ?? "");
  return (
    <section className="card version-card">
      <div className="card-header">
        <h2>{t("Обновление экземпляра")}</h2>
        <span className="version-current">{current ? normalizeVersion(current) : t("Не установлена")}</span>
        <button
          type="button"
          className="icon-btn"
          aria-label={t("Проверить версии HY2")}
          disabled={versions.isFetching || isBusy}
          onClick={() => void versions.refetch()}
        >
          <RefreshCw width={24} height={24} aria-hidden />
        </button>
      </div>
      <div className="version-body">
        <div className="version-controls">
          <label htmlFor="core-version">
            {t("Версия HY2")}
            <Select
              id="core-version"
              value={version}
              disabled={versions.isPending || isBusy || !!versions.error}
              onValueChange={setSelected}
            >
              <SelectOption value="">{t("Выберите версию")}</SelectOption>
              {versions.data?.map((release) => (
                <ReleaseOption key={release.tag} release={release} current={current} />
              ))}
            </Select>
          </label>
          <button
            type="button"
            className="primary"
            disabled={!canInstall}
            onClick={() => setConfirmation("install")}
          >
            <Download width={24} height={24} aria-hidden />
            {t(isCurrent ? "Установлена" : "Установить")}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={isBusy || !status.data?.rollbackAvailable}
            onClick={() => setConfirmation("rollback")}
          >
            <Undo2 width={24} height={24} aria-hidden />
            {t("Откатить")}
            {previous ? " " + previous : ""}
          </button>
        </div>
        <p className="caption" role="status">
          {versions.isPending
            ? t("Получаем версии с GitHub…")
            : versions.error
              ? t("Не удалось загрузить версии. Повторите проверку.")
              : isLatest
                ? t("Установлена последняя версия")
                : t("Файл проверяется по SHA-256. Предыдущая версия сохраняется для отката.")}
        </p>
        {status.data && <UpdateProgress status={status.data} />}
      </div>
      {confirmation && (
        <UpdateConfirmation
          mode={confirmation}
          version={confirmation === "rollback" ? (status.data?.previous ?? "") : version}
          onClose={() => setConfirmation(null)}
        />
      )}
    </section>
  );
}
