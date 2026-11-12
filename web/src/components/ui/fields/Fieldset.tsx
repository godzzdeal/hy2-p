import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
import { FieldsetDisabledContext, useFieldsetDisabled } from "@/hooks/ui/use-fieldset";
export function Fieldset({ className, disabled, ...props }: ComponentProps<"fieldset">) {
  const isParentDisabled = useFieldsetDisabled();
  const isDisabled = isParentDisabled || !!disabled;
  return (
    <FieldsetDisabledContext value={isDisabled}>
      <fieldset
        {...props}
        disabled={isDisabled}
        className={cn("grid grid-cols-1 min-w-0 gap-3", className)}
      />
    </FieldsetDisabledContext>
  );
}
