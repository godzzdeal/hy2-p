import { Caption } from "@/components/elements/Caption";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { Field } from "@/components/ui/fields/Field";
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
    <div className="panel-maintenance grid gap-3 min-w-0">
      <Actions>
        <span>
          {t("Установлено")}: <strong>{installation.current.replace(/^v/, "")}</strong>
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={model.versions.isFetching}
          onClick={() => void model.versions.refetch()}
        >
          {t("Проверить версии панели")}
        </Button>
      </Actions>
      <QueryState isLoading={model.versions.isPending} error={model.versions.error} />
      <Field>
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
      </Field>
      {model.versions.data?.length === 0 && (
        <Caption>{t("Версии с готовым образом пока не найдены.")}</Caption>
      )}
      <Actions>
        <Button
          type="button"
          variant="primary"
          disabled={!model.canUpdate}
          onClick={() => model.setConfirmation({ action: "update", version: model.version })}
        >
          {t("Обновить панель")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!model.canRollback}
          onClick={() => model.setConfirmation({ action: "rollback", restoreData: true })}
        >
          {t("Откатить панель")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!model.canRollback}
          onClick={() => model.setConfirmation({ action: "cleanup" })}
        >
          {t("Удалить старые образы")}
        </Button>
      </Actions>
      {installation.previous && (
        <Caption>
          {t("Предыдущая версия")}: {installation.previous.replace(/^v/, "")}
        </Caption>
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
