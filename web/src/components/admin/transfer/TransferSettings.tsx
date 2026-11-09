import { CommandBlock } from "@/components/elements/CommandBlock";
import { CoreBinding } from "@/components/admin/transfer/preview";
import { TransferPreview } from "@/components/admin/transfer/preview/TransferPreview";
import { useTransfer } from "@/hooks/admin/transfer/use-transfer";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
export function TransferSettings() {
  const { t } = useTranslation();
  const transfer = useTransfer();
  const fileInput = useRef<HTMLInputElement>(null);
  const canApply = transfer.preview?.rows.some((row) => row.action === "add") && !transfer.hasApplied;
  return (
    <section className="card" data-scroll-section data-scroll-label={t("Перенос данных")}>
      <div className="card-header">
        <h2>{t("Импорт и экспорт")}</h2>
      </div>
      <div className="form-body transfer-form">
        <p>
          {t(
            "Перенос конфигураций ядер, пользователей, групп и лимитов между панелями HY2-P. Существующие записи не перезаписываются.",
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
          <button
            type="button"
            className="secondary"
            disabled={transfer.isBusy}
            onClick={() => fileInput.current?.click()}
          >
            {t("Выбрать файл импорта")}
          </button>
          <input
            ref={fileInput}
            aria-label={t("Файл импорта HY2-P")}
            hidden
            type="file"
            accept=".json,application/json"
            disabled={transfer.isBusy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) transfer.onRead(file);
              event.target.value = "";
            }}
          />
        </div>
        {transfer.filename && <p>{transfer.filename}</p>}
        {transfer.isBusy && <p role="status">{t("Обрабатываем файл…")}</p>}
        {!transfer.hasApplied &&
          transfer.preview?.rows
            .filter((row) => row.kind === "core")
            .map((row) => (
              <CoreBinding key={row.id} row={row} isDisabled={transfer.isBusy} onBind={transfer.onBind} />
            ))}
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
          <summary>{t("Импорт через терминал")}</summary>
          <CommandBlock command="sudo hy2-panel export /root/hy2-p.json" />
          <CommandBlock command="sudo hy2-panel import /root/hy2-p.json" />
          <CommandBlock command="sudo hy2-panel import /root/hy2-p.json --apply" />
          <p>{t("Чтобы связать пользователей с существующим основным ядром:")}</p>
          <CommandBlock command="sudo hy2-panel import /root/hy2-p.json --map-core default=default --apply" />
        </details>
      </div>
    </section>
  );
}
