import { usePageNavigation } from "@/hooks/layout/use-page-navigation";
import { useInstanceCommands } from "./use-commands";
import { useInstanceSelection } from "./use-instances";
import { DEFAULT_INSTANCE, type IInstance } from "@/services/instances/types";
import { useTranslation } from "react-i18next";

export function useInstanceCard(instance: IInstance) {
  const { t } = useTranslation();
  const { id, select, isPending } = useInstanceSelection();
  const { selectPage } = usePageNavigation();
  const { control, remove } = useInstanceCommands();
  const isBusy = isPending || instance.updating || !!instance.removing;
  const isStarted = instance.running || instance.desiredRunning === true;
  const canDelete = !isPending && !isStarted && !instance.updating;
  const canRestart = !isBusy && instance.running;
  function onConfigure() {
    if (select(instance.id)) selectPage("config");
  }
  function onManage() {
    if (select(instance.id)) selectPage("core");
  }
  function onToggle() {
    if (!isBusy) control.mutate({ id: instance.id, action: isStarted ? "stop" : "start" });
  }
  function onRestart() {
    if (canRestart) control.mutate({ id: instance.id, action: "restart" });
  }
  function onRemove() {
    if (
      canDelete &&
      window.confirm(
        t("Удалить экземпляр «{{name}}» и его конфигурацию? Пользователи останутся в панели.", {
          name: instance.name,
        }),
      )
    )
      remove.mutate(instance.id);
  }
  const status = instance.removing
    ? "Удаление порта"
    : instance.updating
      ? "Обновляется"
      : instance.running
        ? "Запущено"
        : instance.desiredRunning
          ? "Восстановление"
          : "Остановлено";
  return {
    isSelected: id === instance.id,
    isBusy,
    isStarted,
    canRestart,
    canDelete,
    canManage: !isPending && !instance.removing,
    hasDelete: instance.id !== DEFAULT_INSTANCE,
    isRemoving: !!instance.removing,
    status,
    onConfigure,
    onManage,
    onToggle,
    onRestart,
    onRemove,
  };
}

export type TInstanceControls = ReturnType<typeof useInstanceCard>;
