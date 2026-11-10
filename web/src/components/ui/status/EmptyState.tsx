import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
export function EmptyState({ className, ...props }: ComponentProps<"p">) {
  return <p {...props} className={cn("empty px-6 py-12 text-center text-muted", className)} />;
}
