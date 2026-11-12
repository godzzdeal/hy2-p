import { Button } from "@/components/ui/button/Button";
import { FileCode2, Gauge, Power, Square, RefreshCw, Trash2 } from "@/components/elements/icons";
import { Pencil } from "pixelarticons/react/Pencil.js";
import type { TInstanceControls } from "@/hooks/instances/use-instance-card";
import { useTranslation } from "react-i18next";

export function InstanceActions({
  controls,
  onRename,
}: {
  controls: TInstanceControls;
  onRename: () => void;
}) {
  const { t } = useTranslation();
  const ToggleIcon = controls.isStarted ? Square : Power;
  const toggleLabel = t(controls.isStarted ? "Остановить" : "Запустить");
  const removeLabel = t(controls.isRemoving ? "Повторить удаление" : "Удалить");
  return (
    <div className="instance-actions flex flex-wrap gap-2">
      <Button
        size="icon"
        variant="primary"
        title={t("Конфигурация")}
        aria-label={t("Конфигурация")}
        disabled={controls.isBusy}
        onClick={controls.onConfigure}
      >
        <FileCode2 width={24} height={24} aria-hidden />
      </Button>
      <Button
        size="icon"
        variant="outline"
        title={t("Управление HY2")}
        aria-label={t("Управление HY2")}
        disabled={!controls.canManage}
        onClick={controls.onManage}
      >
        <Gauge width={24} height={24} aria-hidden />
      </Button>
      <Button
        size="icon"
        variant="outline"
        title={toggleLabel}
        aria-label={toggleLabel}
        disabled={controls.isBusy}
        onClick={controls.onToggle}
      >
        <ToggleIcon width={24} height={24} aria-hidden />
      </Button>
      <Button
        size="icon"
        variant="outline"
        title={t("Перезапустить")}
        aria-label={t("Перезапустить")}
        disabled={!controls.canRestart}
        onClick={controls.onRestart}
      >
        <RefreshCw width={24} height={24} aria-hidden />
      </Button>
      <Button
        size="icon"
        title={t("Переименовать")}
        aria-label={t("Переименовать")}
        disabled={controls.isBusy}
        onClick={onRename}
      >
        <Pencil width={24} height={24} aria-hidden />
      </Button>
      {controls.hasDelete && (
        <Button
          size="icon"
          variant="danger"
          title={removeLabel}
          aria-label={removeLabel}
          disabled={!controls.canDelete}
          onClick={controls.onRemove}
        >
          <Trash2 width={24} height={24} aria-hidden />
        </Button>
      )}
    </div>
  );
}
