import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
export function Fieldset({ className, ...props }: ComponentProps<"fieldset">) {
  return <fieldset {...props} className={cn("grid grid-cols-1 min-w-0 gap-3", className)} />;
}
