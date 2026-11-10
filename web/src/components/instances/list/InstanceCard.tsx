import { CardHeader } from "@/components/ui/cards/CardHeader";
import { Card } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/button/Button";
import { useInstanceCommands } from "@/hooks/instances/use-commands";
import { useInstanceSelection } from "@/hooks/instances/use-instances";
import { DEFAULT_INSTANCE, type IInstance } from "@/services/instances/types";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
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
        t("Удалить экземпляр «{{name}}» и его конфигурацию? Пользователи останутся в панели.", {
          name: instance.name,
        }),
      )
    )
      remove.mutate(instance.id);
  }
  return (
    <Card
      className={cn("instance-card", { "is-selected border-accent": id === instance.id })}
      aria-label={instance.name}
    >
      <CardHeader>
        <h2>{instance.name}</h2>
        <span className={cn("badge py-1 px-2", { "badge-success": instance.running })}>
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
      </CardHeader>
      <dl className="instance-details p-4 m-0 grid grid-cols-2 gap-3 max-tablet:grid-cols-2">
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
      {instance.error && (
        <p className="alert bg-danger-bg text-danger border border-danger p-4 rounded-none flex justify-between items-center gap-4 mb-5">
          {t(instance.error)}
        </p>
      )}
      <div className="instance-actions flex flex-wrap gap-2">
        <Button variant="primary" disabled={isBusy} onClick={onConfigure}>
          {t("Конфигурация")}
        </Button>
        <Button disabled={isPending || !!instance.removing} onClick={onLogs}>
          {t("Управление HY2")}
        </Button>
        <Button
          disabled={isBusy}
          onClick={() => control.mutate({ id: instance.id, action: isStarted ? "stop" : "start" })}
        >
          {t(isStarted ? "Остановить" : "Запустить")}
        </Button>
        <Button
          disabled={isBusy || !instance.running}
          onClick={() => control.mutate({ id: instance.id, action: "restart" })}
        >
          {t("Перезапустить")}
        </Button>
        <Button disabled={isBusy} onClick={() => onRename(instance)}>
          {t("Переименовать")}
        </Button>
        {instance.id !== DEFAULT_INSTANCE && (
          <Button variant="danger" disabled={isPending || isStarted || instance.updating} onClick={onRemove}>
            {t(instance.removing ? "Повторить удаление" : "Удалить")}
          </Button>
        )}
      </div>
    </Card>
  );
}
