import { UpdateConfirmation } from "@/components/core/UpdateConfirmation";
import { ReleaseOption } from "@/components/core/versions/ReleaseOption";
import { UpdateProgress } from "@/components/core/versions/UpdateProgress";
import { Download, RefreshCw, Undo2 } from "@/components/elements/icons";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useReleaseVersions, useUpdateStatus } from "@/hooks/core/updates/use-updates";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function UpdateCard() {
  const { t } = useTranslation();
  const versions = useReleaseVersions();
  const status = useUpdateStatus();
  const [selected, setSelected] = useState("");
  const [confirmation, setConfirmation] = useState<"install" | "rollback" | null>(null);
  const version =
    selected ||
    versions.data?.find((release) => release.available && release.tag !== status.data?.current)?.tag ||
    "";
  const isBusy = status.data?.busy === true;
  const hasSelection = version !== "" && version !== status.data?.current;
  return (
    <section className="card version-card">
      <div className="card-header">
        <div>
          <span className="eyebrow">{t("ОБНОВЛЕНИЕ ЯДРА")}</span>
          <h2>{t("Обновление Hysteria2")}</h2>
        </div>
        <span className="verified-label">SHA-256</span>
      </div>
      <div className="version-body">
        <div className="version-summary">
          <div>
            <span>{t("Установленная")}</span>
            <strong>{status.data?.current.replace("app/", "") || t("Не установлена")}</strong>
          </div>
          <div>
            <span>{t("Для отката")}</span>
            <strong>{status.data?.previous.replace("app/", "") || t("Пока нет")}</strong>
          </div>
        </div>
        <label htmlFor="core-version">
          {t("Версия Hysteria2")}
          <Select
            id="core-version"
            value={version}
            disabled={versions.isPending || isBusy || !!versions.error}
            onValueChange={(nextValue) => setSelected(nextValue)}
          >
            <SelectOption value="">{t("Выберите версию")}</SelectOption>
            {versions.data?.map((release) => (
              <ReleaseOption key={release.tag} release={release} current={status.data?.current ?? ""} />
            ))}
          </Select>
        </label>
        {versions.isPending && (
          <p className="muted" role="status">
            {t("Получаем версии с GitHub\u2026")}
          </p>
        )}
        {versions.error && (
          <div className="inline-error" role="alert">
            <p>{t(versions.error.message)}</p>
            <button className="text-btn" onClick={() => void versions.refetch()}>
              <RefreshCw width={24} height={24} aria-hidden />
              {t("Повторить")}
            </button>
          </div>
        )}
        {status.error && (
          <p className="inline-error" role="alert">
            {t(status.error.message)}
          </p>
        )}
        {!versions.isPending && !versions.error && versions.data?.length === 0 && (
          <p className="muted">{t("Стабильных релизов пока нет.")}</p>
        )}
        <div className="version-actions">
          <button
            className="primary"
            disabled={isBusy || !hasSelection || !status.data}
            onClick={() => setConfirmation("install")}
          >
            <Download width={24} height={24} aria-hidden />
            {t("Установить версию")}
          </button>
          <button
            className="secondary"
            disabled={isBusy || !status.data?.rollbackAvailable}
            onClick={() => setConfirmation("rollback")}
          >
            <Undo2 width={24} height={24} aria-hidden />
            {t("Откатить")}
          </button>
        </div>
        {status.data && <UpdateProgress status={status.data} />}
        <p className="caption">
          {t("Проверяем подлинность файла и сохраняем предыдущую версию для отката.")}
        </p>
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
