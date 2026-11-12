import { Check } from "@/components/elements/icons";
import { encodeSelectValue } from "@/components/ui/select/select-value";
import * as Primitive from "@radix-ui/react-select";
import { type ComponentProps } from "react";
import { cn } from "@/utils/cn";
import { useFieldsetDisabled } from "@/hooks/ui/use-fieldset";
interface ISelectOption extends Omit<ComponentProps<typeof Primitive.Item>, "value"> {
  value: string | number;
}
export function SelectOption({ value, children, disabled, className, ...props }: ISelectOption) {
  const isFieldsetDisabled = useFieldsetDisabled();
  return (
    <Primitive.Item
      {...props}
      className={cn(
        "select-option flex min-h-control cursor-pointer items-center justify-between gap-4 px-3 py-2 text-xl outline-none data-highlighted:bg-surface-soft data-disabled:pointer-events-none data-disabled:opacity-50 selected-option:font-semibold selected-option:text-accent",
        className,
      )}
      value={encodeSelectValue(value)}
      disabled={isFieldsetDisabled || disabled}
    >
      <Primitive.ItemText>{children}</Primitive.ItemText>
      <Primitive.ItemIndicator className={cn("flex w-6 shrink-0")}>
        <Check width={24} height={24} aria-hidden />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}
