import { CHECKBOX_STYLES, CONTROL_STYLES } from "@/components/ui/fields/controls/control-styles";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

export function Input({ type = "text", className, ...props }: ComponentProps<"input">) {
  return (
    <input
      {...props}
      type={type}
      className={cn(type === "checkbox" ? CHECKBOX_STYLES : [CONTROL_STYLES, "h-control"], className)}
    />
  );
}
