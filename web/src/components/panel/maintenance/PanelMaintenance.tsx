import { PanelConfirmation } from "@/components/panel/maintenance/PanelConfirmation";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { QueryState } from "@/components/ui/loading";
import { Notice } from "@/components/ui/feedback";
import { usePanelMaintenance } from "@/hooks/panel/maintenance";
import { useTranslation } from "react-i18next";

export function PanelMaintenance() {
  const { t } = useTranslation();
  const model = usePanelMaintenance();
  const installation = model.installation.data;
  if (model.installation.isPending || model.installation.error)
    return <QueryState isLoading={model.installation.isPending} error={model.installation.error} />;
  if (!installation?.available)
    return <Notice>{t("Обновление из панели доступно при установке через установщик HY2-P.")}</Notice>;
  return (
    <div className="panel-maintenance">
      <div className="row-actions">
        <span>
          {t("Установлено")}: <strong>{installation.current.replace(/^v/, "")}</strong>
        </span>
        <button
          type="button"
          className="text-btn"
          disabled={model.versions.isFetching}
          onClick={() => void model.versions.refetch()}
        >
          {t("Проверить версии панели")}
        </button>
      </div>
      <QueryState isLoading={model.versions.isPending} error={model.versions.error} />
      <label>
        {t("Версия панели")}
        <Select
          aria-label={t("Версия панели")}
          value={model.version}
          onValueChange={model.setSelection}
          disabled={model.isBusy || !model.versions.data?.length}
        >
          {(model.versions.data ?? []).map((version) => (
            <SelectOption key={version.version} value={version.version}>
              {version.version.replace(/^v/, "")}
            </SelectOption>
          ))}
        </Select>
      </label>
      {model.versions.data?.length === 0 && (
        <p className="caption">{t("Версии с готовым образом пока не найдены.")}</p>
      )}
      <div className="row-actions">
        <button
          type="button"
          className="primary"
          disabled={!model.canUpdate}
          onClick={() => model.setConfirmation({ action: "update", version: model.version })}
        >
          {t("Обновить панель")}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!model.canRollback}
          onClick={() => model.setConfirmation({ action: "rollback", restoreData: true })}
        >
          {t("Откатить панель")}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!model.canRollback}
          onClick={() => model.setConfirmation({ action: "cleanup" })}
        >
          {t("Удалить старые образы")}
        </button>
      </div>
      {installation.previous && (
        <p className="caption">
          {t("Предыдущая версия")}: {installation.previous.replace(/^v/, "")}
        </p>
      )}
      {model.confirmation && (
        <PanelConfirmation
          input={model.confirmation}
          installation={installation}
          onClose={() => model.setConfirmation(null)}
        />
      )}
    </div>
  );
}
