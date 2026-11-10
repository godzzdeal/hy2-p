import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useInstanceRecovery, useInstances, useInstanceSelection } from "@/hooks/instances/use-instances";
import { useTranslation } from "react-i18next";
export function InstanceSelector() {
  const { t } = useTranslation();
  const query = useInstances();
  const { id, select, isPending } = useInstanceSelection();
  useInstanceRecovery();
  return (
    <label className="instance-selector">
      <span>{t("Выбранный экземпляр")}</span>
      <Select
        aria-label={t("Выбранный экземпляр")}
        value={id}
        disabled={isPending || !query.data}
        onValueChange={select}
      >
        {(query.data ?? [])
          .filter((item) => !item.removing)
          .map((item) => (
            <SelectOption key={item.id} value={item.id}>
              {item.name}
            </SelectOption>
          ))}
      </Select>
    </label>
  );
}
