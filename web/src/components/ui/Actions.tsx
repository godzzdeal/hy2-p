import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

export function Actions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div {...props} className={cn("row-actions flex min-w-0 flex-wrap items-center gap-2", className)} />
  );
}
