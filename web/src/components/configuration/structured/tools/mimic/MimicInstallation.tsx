import { CommandBlock } from "@/components/elements/copy";
import { useTranslation } from "react-i18next";
import { InstanceSelector } from "@/components/instances/list";
import { ChevronRight } from "@/components/elements/icons";

export function MimicInstallation({ command }: { command: string }) {
  const { t } = useTranslation();
  return (
    <section
      className="grid min-w-0 gap-3 border-2 border-line bg-input p-4"
      aria-label={t("Установка Mimic")}
    >
      <h3>{t("Установка Mimic")}</h3>
      <InstanceSelector label="Экземпляр для Mimic" className="m-0 flex-wrap" />
      <p className="m-0 text-muted">
        {t(
          "Выполните на сервере. Команда установит модуль Linux, добавит TCP-порт и перезапустит панель после подтверждения.",
        )}
      </p>
      <CommandBlock command={command} />
      <details>
        <summary>
          <ChevronRight width={20} height={20} aria-hidden />
          {t("Отключение и удаление")}
        </summary>
        <div className="grid gap-3 pt-3">
          <p className="m-0 text-muted">
            {t("Перед отключением выключите mimic.enabled и сохраните конфигурацию.")}
          </p>
          <CommandBlock
            label={t("Отключить режим установки")}
            command="sudo hy2-panel mimic-setup --disable"
          />
          <CommandBlock label={t("Удалить Mimic")} command="sudo hy2-panel mimic-uninstall" />
        </div>
      </details>
    </section>
  );
}
