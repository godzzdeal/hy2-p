import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useInstances } from "@/hooks/instances/use-instances";
import { type ITransferRow } from "@/services/admin/transfer/api";
import { useTranslation } from "react-i18next";
export function CoreBinding({
  row,
  isDisabled,
  onBind,
}: {
  row: ITransferRow;
  isDisabled: boolean;
  onBind: (source: string, target: string) => void;
}) {
  const { t } = useTranslation();
  const instances = useInstances();
  return (
    <label>
      {row.name}: {t("Использовать существующее ядро")}
      <Select
        aria-label={t("Ядро для импорта") + ": " + row.name}
        value={row.target ?? ""}
        disabled={isDisabled}
        onValueChange={(target) => onBind(row.id, target)}
      >
        <SelectOption value="">{t("Добавить отдельную конфигурацию")}</SelectOption>
        {instances.data
          ?.filter((instance) => !instance.removing)
          .map((instance) => (
            <SelectOption key={instance.id} value={instance.id}>
              {instance.name}
            </SelectOption>
          ))}
      </Select>
    </label>
  );
}
