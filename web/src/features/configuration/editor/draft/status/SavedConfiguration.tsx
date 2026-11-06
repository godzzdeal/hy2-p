import { useTranslation } from "react-i18next";
import { useCore, useCoreControl } from "@/features/core/model";
import { Power, RefreshCw } from "@/shared/icons";
export function SavedConfiguration({
  sequence,
  isDirty,
  onApplied,
}: {
  sequence: number;
  isDirty: boolean;
  onApplied: (sequence: number) => void;
}) {
  const { t } = useTranslation();
  const core = useCore();
  const control = useCoreControl();
  if (!sequence || isDirty) return null;
  const isRunning = core.data?.running === true;
  const Icon = isRunning ? RefreshCw : Power;
  return (
    <div className="saved-configuration" role="status">
      <div>
        <strong>{t("Конфигурация сохранена")}</strong>
        <p>
          {t(
            isRunning
              ? "Перезапуск включит новые настройки и ненадолго прервёт подключения."
              : "Запустите ядро, чтобы включить сервер с сохранёнными настройками.",
          )}
        </p>
      </div>
      <button
        type="button"
        className="primary"
        disabled={control.isPending || !core.data?.available}
        onClick={() =>
          control.mutate(isRunning ? "restart" : "start", { onSuccess: () => onApplied(sequence) })
        }
      >
        <Icon width={24} height={24} aria-hidden />
        {t(control.isPending ? "Применяем…" : isRunning ? "Перезапустить ядро" : "Запустить ядро")}
      </button>
    </div>
  );
}
