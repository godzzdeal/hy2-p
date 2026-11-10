import { Button } from "@/components/ui/button/Button";
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
    <div className="draft-bar sticky bottom-3 z-10 flex items-center justify-between gap-3 flex-wrap py-3 px-4 border border-line bg-surface max-tablet:bottom-16">
      <div>
        <span role="status">
          {isDirty ? t("Есть несохранённые изменения") : t("Все изменения сохранены")}
        </span>
        <small className="hidden text-muted md:block">
          {t("Сохранение не прерывает подключения. Чтобы применить настройки, перезапустите экземпляр.")}
        </small>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={!isDirty || isPending} onClick={onReset}>
          {t("Отменить")}
        </Button>
        <Button aria-label={t("Сохранить конфигурацию")} variant="primary" disabled={isPending || !isDirty}>
          {isPending ? t("Сохраняем…") : t("Сохранить")}
        </Button>
      </div>
    </div>
  );
}
