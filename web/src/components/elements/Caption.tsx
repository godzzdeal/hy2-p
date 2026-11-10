import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
export function Caption({ className, ...props }: ComponentProps<"p">) {
  return <p {...props} className={cn("caption text-lg leading-snug text-muted", className)} />;
}
