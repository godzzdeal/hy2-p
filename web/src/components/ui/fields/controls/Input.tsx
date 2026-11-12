import { CHECKBOX_STYLES, CONTROL_STYLES } from "@/components/ui/fields/controls/control-styles";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

export function Input({ type = "text", className, onChange, ...props }: ComponentProps<"input">) {
  const onNumberChange: NonNullable<ComponentProps<"input">["onChange"]> = (event) => {
    const input = event.currentTarget;
    const normalized = input.value.replace(/^(-?)0+(?=\d)/, "$1");
    if (input.value !== normalized) input.value = normalized;
    onChange?.(event);
  };
  return (
    <input
      {...props}
      type={type}
      onChange={type === "number" ? onNumberChange : onChange}
      className={cn(type === "checkbox" ? CHECKBOX_STYLES : [CONTROL_STYLES, "h-control"], className)}
    />
  );
}
