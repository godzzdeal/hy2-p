import type { IInstance } from "@/services/instances/types";
import { useTranslation } from "react-i18next";
import { normalizeVersion } from "@/utils/core/version";

export function InstanceDetails({ instance }: { instance: IInstance }) {
  const { t } = useTranslation();
  return (
    <dl className="instance-details m-0 flex min-w-0 flex-wrap items-baseline gap-x-6 gap-y-2 px-3 py-2">
      <div className="min-w-0">
        <dt>{t("Адрес")}</dt>
        <dd>{instance.host || t("Не настроен")}</dd>
      </div>
      <div className="min-w-0">
        <dt>UDP</dt>
        <dd>
          {instance.publishedPort || instance.port}
          {instance.portChangeRequired && <span className="text-warning"> {t("Порт не применён")}</span>}
        </dd>
      </div>
      <div className="min-w-0">
        <dt>{t("Версия")}</dt>
        <dd>{normalizeVersion(instance.version) || t("Неизвестна")}</dd>
      </div>
      <div className="min-w-0">
        <dt>{t("Доступ")}</dt>
        <dd title={t(instance.authMode === "native" ? "Из конфигурации" : "Пользователи панели")}>
          {t(instance.authMode === "native" ? "Конфигурация" : "Панель")}
        </dd>
      </div>
    </dl>
  );
}
