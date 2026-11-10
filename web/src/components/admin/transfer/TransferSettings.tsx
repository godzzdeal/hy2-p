import { Caption } from "@/components/elements/Caption";
import { CardBody } from "@/components/ui/cards/CardBody";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
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
      <CardBody className="transfer-form">
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
        <Actions>
          <Button type="button" variant="secondary" disabled={transfer.isBusy} onClick={transfer.onExport}>
            {t("Экспортировать данные")}
          </Button>
        </Actions>
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
          <Caption>
            {t(
              "Исключённые экземпляры не создаются и не попадают в доступ пользователей и групп. Если исключить все экземпляры пользователя, он будет добавлен без доступных подключений.",
            )}
          </Caption>
        )}
        {transfer.preview && (
          <TransferPreview
            key={transfer.preview.fingerprint + String(transfer.hasApplied)}
            value={transfer.preview}
          />
        )}
        <Button
          type="button"
          variant="primary"
          disabled={transfer.isBusy || !canApply}
          onClick={transfer.onApply}
        >
          {t("Добавить новые записи")}
        </Button>
        {transfer.preview && (
          <Button type="button" variant="secondary" disabled={transfer.isBusy} onClick={transfer.onRefresh}>
            {t("Проверить ещё раз")}
          </Button>
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
      </CardBody>
    </SettingsSection>
  );
}
