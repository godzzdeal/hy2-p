import { Button } from "@/components/ui/button/Button";
import { Power, RefreshCw } from "@/components/elements/icons";
import { useCore, useCoreControl } from "@/hooks/core/use-core";
import { useTranslation } from "react-i18next";
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
    <div
      className="saved-configuration p-4 border border-l-4 border-accent bg-success-bg flex items-center justify-between gap-4 mb-4 max-tablet:items-start max-tablet:flex-col"
      role="status"
    >
      <div>
        <strong>{t("Конфигурация сохранена")}</strong>
        <p>
          {t(
            isRunning
              ? "Перезапуск включит новые настройки и ненадолго прервёт подключения."
              : "Запустите экземпляр, чтобы применить сохранённые настройки.",
          )}
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        disabled={control.isPending || !core.data?.available}
        onClick={() =>
          control.mutate(isRunning ? "restart" : "start", {
            onSuccess: () => onApplied(sequence),
          })
        }
      >
        <Icon width={24} height={24} aria-hidden />
        {t(control.isPending ? "Применяем…" : isRunning ? "Перезапустить" : "Запустить")}
      </Button>
    </div>
  );
}
