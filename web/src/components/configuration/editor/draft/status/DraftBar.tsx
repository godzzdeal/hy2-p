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
    <div className="draft-bar">
      <div>
        <span role="status">
          {isDirty ? t("Есть несохранённые изменения") : t("Все изменения сохранены")}
        </span>
        <small className="hidden text-muted md:block">
          {t("Сохранение не прерывает подключения. Чтобы применить настройки, перезапустите экземпляр.")}
        </small>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="text-btn" disabled={!isDirty || isPending} onClick={onReset}>
          {t("Отменить")}
        </button>
        <button aria-label={t("Сохранить конфигурацию")} className="primary" disabled={isPending || !isDirty}>
          {isPending ? t("Сохраняем…") : t("Сохранить")}
        </button>
      </div>
    </div>
  );
}
