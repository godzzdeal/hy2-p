import { Button } from "@/components/ui/button/Button";
import { TriangleAlert, RotateCcw } from "@/components/elements/icons";
import { useTranslation } from "react-i18next";
export function DraftBar({
  isDirty,
  isPending,
  onReset,
}: {
  isDirty: boolean;
  isPending: boolean;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  if (!isDirty && !isPending) return null;
  return (
    <div
      className="draft-bar sticky bottom-3 z-10 flex items-center justify-between gap-4 flex-wrap p-4 border-2 border-warning border-l-4 bg-warning-bg shadow-pixel max-tablet:bottom-16 max-tablet:gap-2 max-tablet:p-3 max-tablet:flex-nowrap"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-start gap-3 max-tablet:gap-2">
        <TriangleAlert width={24} height={24} className="shrink-0 text-warning" aria-hidden />
        <div className="grid min-w-0 gap-1">
          <strong className="text-warning">
            <span className="hidden md:inline">
              {isDirty ? t("Есть несохранённые изменения") : t("Все изменения сохранены")}
            </span>
            <span className="md:hidden text-lg">{t(isDirty ? "Не сохранено" : "Сохранено")}</span>
          </strong>
          <small className="hidden text-foreground md:block">
            {t("Сохранение не прерывает подключения. Для применения перезапустите экземпляр.")}
          </small>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          aria-label={t("Отменить")}
          title={t("Отменить")}
          disabled={!isDirty || isPending}
          onClick={onReset}
        >
          <RotateCcw width={20} height={20} className="md:hidden" aria-hidden />
          <span className="hidden md:inline">{t("Отменить")}</span>
        </Button>
        <Button aria-label={t("Сохранить конфигурацию")} variant="primary" disabled={isPending || !isDirty}>
          {isPending ? t("Сохраняем…") : t("Сохранить")}
        </Button>
      </div>
    </div>
  );
}
