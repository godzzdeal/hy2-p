import { CONTROL_STYLES } from "@/components/ui/fields/controls/control-styles";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea {...props} className={cn(CONTROL_STYLES, "max-w-full resize-y py-2 leading-snug", className)} />
  );
}
