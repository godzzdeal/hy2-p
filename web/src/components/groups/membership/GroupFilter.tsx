import { Field } from "@/components/ui/fields/Field";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useGroups } from "@/hooks/groups/hooks";
import { GROUP_FILTERS } from "@/services/groups/types";
import { useTranslation } from "react-i18next";
export function GroupFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const query = useGroups();
  return (
    <Field className="group-filter min-w-40 max-w-60 m-0 flex items-center min-h-control max-tablet:max-w-none max-tablet:flex-1">
      <span className="sr-only">{t("Фильтр по группе")}</span>
      <Select
        aria-label={t("Фильтр по группе")}
        value={value}
        onValueChange={onChange}
        disabled={query.isPending || !!query.error}
      >
        <SelectOption value={GROUP_FILTERS.all}>{t("Все группы")}</SelectOption>
        <SelectOption value={GROUP_FILTERS.ungrouped}>{t("Без группы")}</SelectOption>
        {query.data?.groups?.map((group) => (
          <SelectOption key={group.id} value={group.id}>
            {group.name}
          </SelectOption>
        ))}
      </Select>
    </Field>
  );
}
