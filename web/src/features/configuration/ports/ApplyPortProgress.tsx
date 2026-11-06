import { useTranslation } from "react-i18next";
import { CheckCircle2, LoaderCircle, TriangleAlert } from "@/shared/icons";
import { usePortProgress, usePortOperationStore } from "@/features/configuration/model/deployment/operation";
export function ApplyPortProgress() {
  const { t } = useTranslation();
  const query = usePortProgress();
  const clear = usePortOperationStore((state) => state.setTicket);
  if (!query.ticket) return null;
  const result = query.data;
  const isBusy = !query.isMissing && (!result || result.busy);
  const isSuccess = result?.phase === "success";
  const Icon = isBusy ? LoaderCircle : isSuccess ? CheckCircle2 : TriangleAlert;
  return (
    <aside className="port-operation" aria-label={t("Применение UDP-порта")}>
      <div className="flex items-start gap-3">
        <Icon width={24} height={24} aria-hidden />
        <div>
          <strong>
            {t(
              result?.remove
                ? isBusy
                  ? "Удаляем UDP-порт ядра"
                  : isSuccess
                    ? "UDP-порт ядра удалён"
                    : "Не удалось удалить UDP-порт ядра"
                : isBusy
                  ? "Применяем и проверяем UDP-порт"
                  : isSuccess
                    ? "UDP-порт применён"
                    : "UDP-порт не применён",
            )}
          </strong>
          <p role="status">
            {query.isMissing
              ? query.error?.message
              : query.error
                ? t("Восстанавливаем связь с панелью. Проверка продолжается.")
                : t(result?.message ?? "Ожидаем ответ помощника…")}
          </p>
        </div>
      </div>
      {!isBusy && (
        <div className="mt-3">
          {isSuccess && !result?.remove && (
            <p>
              {t(
                "Проверены проброс Docker, локальный UDP-ответ и работа ядра. Доступ из мобильной сети и firewall хостинга проверяются отдельно.",
              )}
            </p>
          )}
          <p>{t("Если появился экран входа, войдите в панель заново.")}</p>
          <button type="button" className="secondary mt-2" onClick={() => clear("")}>
            {t("Понятно")}
          </button>
        </div>
      )}
    </aside>
  );
}
