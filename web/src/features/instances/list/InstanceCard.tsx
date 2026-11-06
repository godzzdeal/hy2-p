import { useTranslation } from "react-i18next";
import { useUiStore } from "@/app/state";
import { cn } from "@/shared/lib";
import { useInstanceCommands, useInstanceSelection } from "../data";
import { DEFAULT_INSTANCE, type IInstance } from "../model";
export function InstanceCard({
  instance,
  onRename,
}: {
  instance: IInstance;
  onRename: (instance: IInstance) => void;
}) {
  const { t } = useTranslation();
  const { id, select, isPending } = useInstanceSelection();
  const selectPage = useUiStore((state) => state.selectPage);
  const { control, remove } = useInstanceCommands();
  const isBusy = isPending || instance.updating || !!instance.removing;
  const isStarted = instance.running || instance.desiredRunning === true;
  function onConfigure() {
    if (select(instance.id)) selectPage("config");
  }
  function onLogs() {
    if (select(instance.id)) selectPage("core");
  }
  function onRemove() {
    if (
      window.confirm(
        t("Удалить ядро «{{name}}» и его конфигурацию? Пользователи останутся в панели.", {
          name: instance.name,
        }),
      )
    )
      remove.mutate(instance.id);
  }
  return (
    <section
      className={cn("card instance-card", { "is-selected": id === instance.id })}
      aria-label={instance.name}
    >
      <div className="card-header">
        <h2>{instance.name}</h2>
        <span className={cn("badge", { "badge-success": instance.running })}>
          {t(
            instance.removing
              ? "Удаление порта"
              : instance.updating
                ? "Обновляется"
                : instance.running
                  ? "Запущено"
                  : instance.desiredRunning
                    ? "Восстановление"
                    : "Остановлено",
          )}
        </span>
      </div>
      <dl className="instance-details">
        <div>
          <dt>{t("Адрес подключения")}</dt>
          <dd>{instance.host || t("Не настроен")}</dd>
        </div>
        <div>
          <dt>UDP</dt>
          <dd>
            {instance.publishedPort || instance.port}
            {instance.portChangeRequired && <span className="muted"> {t("Порт не применён")}</span>}
          </dd>
        </div>
        <div>
          <dt>{t("Версия")}</dt>
          <dd>{instance.version || t("Неизвестна")}</dd>
        </div>
        <div>
          <dt>{t("Доступ")}</dt>
          <dd>{t(instance.authMode === "native" ? "Из конфигурации" : "Пользователи панели")}</dd>
        </div>
      </dl>
      {instance.error && <p className="alert">{t(instance.error)}</p>}
      <div className="instance-actions">
        <button className="primary" disabled={isBusy} onClick={onConfigure}>
          {t("Конфигурация")}
        </button>
        <button disabled={isPending || !!instance.removing} onClick={onLogs}>
          {t("Ядро и журнал")}
        </button>
        <button
          disabled={isBusy}
          onClick={() => control.mutate({ id: instance.id, action: isStarted ? "stop" : "start" })}
        >
          {t(isStarted ? "Остановить" : "Запустить")}
        </button>
        <button
          disabled={isBusy || !instance.running}
          onClick={() => control.mutate({ id: instance.id, action: "restart" })}
        >
          {t("Перезапустить")}
        </button>
        <button disabled={isBusy} onClick={() => onRename(instance)}>
          {t("Переименовать")}
        </button>
        {instance.id !== DEFAULT_INSTANCE && (
          <button
            className="danger"
            disabled={isPending || isStarted || instance.updating}
            onClick={onRemove}
          >
            {t(instance.removing ? "Повторить удаление" : "Удалить")}
          </button>
        )}
      </div>
    </section>
  );
}
