import { useTranslation } from "react-i18next";
import { Select, SelectOption } from "@/shared/ui/select";
import { useInstances, useInstanceSelection, useInstanceRecovery } from "../data";
export function InstanceSelector() {
  const { t } = useTranslation();
  const query = useInstances();
  const { id, select, isPending } = useInstanceSelection();
  useInstanceRecovery();
  return (
    <label className="instance-selector">
      <span>{t("Выбранное ядро")}</span>
      <Select
        aria-label={t("Выбранное ядро")}
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
