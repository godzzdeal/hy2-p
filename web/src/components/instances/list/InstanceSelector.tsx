import { Field } from "@/components/ui/fields/Field";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useInstanceRecovery, useInstances, useInstanceSelection } from "@/hooks/instances/use-instances";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import type { ComponentProps } from "react";
interface IInstanceSelector extends Omit<ComponentProps<typeof Field>, "children"> {
  label?: string;
}
export function InstanceSelector({ label = "Выбранный экземпляр", className, ...props }: IInstanceSelector) {
  const { t } = useTranslation();
  const query = useInstances();
  const { id, select, isPending } = useInstanceSelection();
  useInstanceRecovery();
  return (
    <Field
      {...props}
      className={cn("instance-selector flex items-center gap-3 mb-4 min-w-0 max-tablet:gap-2", className)}
    >
      <span className="max-tablet:hidden">{t(label)}</span>
      <Select
        className="w-60 max-w-full max-tablet:w-full"
        aria-label={t(label)}
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
