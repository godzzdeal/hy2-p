import { CommandBlock } from "@/components/elements/copy";
import { ChevronRight } from "pixelarticons/react/ChevronRight.js";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { CoreBinding } from "@/components/admin/transfer/preview";
import { TransferPreview } from "@/components/admin/transfer/preview/TransferPreview";
import { useTransfer } from "@/hooks/admin/transfer/use-transfer";
import { useTranslation } from "react-i18next";
import { FileDropzone } from "@/components/elements/upload";
export function TransferSettings() {
  const { t } = useTranslation();
  const transfer = useTransfer();
  const canApply = transfer.preview?.rows.some((row) => row.action === "add") && !transfer.hasApplied;
  return (
    <SettingsSection id="panel-transfer" title={t("Импорт и экспорт")}>
      <div className="form-body transfer-form">
        <p>
          {t(
            "Перенос конфигураций экземпляров, пользователей, групп и лимитов между панелями HY2-P. Существующие записи не перезаписываются.",
          )}
        </p>
        <p className="muted">
          {t(
            "Файл содержит пароли и ссылки подписок. Храните его в защищённом месте. Сертификаты, устройства и пароль входа в панель не переносятся.",
          )}
        </p>
        <div className="row-actions">
          <button type="button" className="secondary" disabled={transfer.isBusy} onClick={transfer.onExport}>
            {t("Экспортировать данные")}
          </button>
        </div>
        <FileDropzone
          label={t("Файл импорта HY2-P")}
          hint={t("JSON, до 16 МБ")}
          accept=".json,application/json"
          isBusy={transfer.isBusy}
          onFile={transfer.onRead}
        />
        {!transfer.hasApplied &&
          transfer.preview?.rows
            .filter((row) => row.kind === "core")
            .map((row) => (
              <CoreBinding key={row.id} row={row} isDisabled={transfer.isBusy} onBind={transfer.onBind} />
            ))}
        {transfer.preview && !transfer.hasApplied && (
          <p className="caption">
            {t(
              "Исключённые экземпляры не создаются и не попадают в доступ пользователей и групп. Если исключить все экземпляры пользователя, он будет добавлен без доступных подключений.",
            )}
          </p>
        )}
        {transfer.preview && (
          <TransferPreview
            key={transfer.preview.fingerprint + String(transfer.hasApplied)}
            value={transfer.preview}
          />
        )}
        <button
          type="button"
          className="primary"
          disabled={transfer.isBusy || !canApply}
          onClick={transfer.onApply}
        >
          {t("Добавить новые записи")}
        </button>
        {transfer.preview && (
          <button type="button" className="secondary" disabled={transfer.isBusy} onClick={transfer.onRefresh}>
            {t("Проверить ещё раз")}
          </button>
        )}
        <details>
          <summary>
            <ChevronRight width={24} height={24} aria-hidden />
            {t("Импорт через терминал")}
          </summary>
          <CommandBlock command="sudo hy2-panel export /root/hy2-p.json" />
          <CommandBlock command="sudo hy2-panel import /root/hy2-p.json" />
          <CommandBlock command="sudo hy2-panel import /root/hy2-p.json --apply" />
          <p>{t("Чтобы связать пользователей с существующим основным экземпляром:")}</p>
          <CommandBlock command="sudo hy2-panel import /root/hy2-p.json --map-core default=default --apply" />
        </details>
      </div>
    </SettingsSection>
  );
}
