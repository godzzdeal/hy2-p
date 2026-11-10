import { Field } from "@/components/ui/fields/Field";
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
    <Field className="instance-selector flex items-center gap-3 mb-4 min-w-0 max-tablet:items-stretch max-tablet:flex-col max-tablet:gap-1">
      <span>{t("Выбранный экземпляр")}</span>
      <Select
        className="w-60 max-w-full max-tablet:w-full"
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
    </Field>
  );
}
