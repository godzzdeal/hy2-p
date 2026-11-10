import { type ComponentProps } from "react";
import { cn } from "@/utils/cn";

export function Notice({ children, className, role = "note", ...props }: ComponentProps<"aside">) {
  return (
    <aside
      {...props}
      className={cn(
        "notice my-4 grid min-w-0 gap-2 border border-line border-l-4 border-l-accent bg-surface-soft p-4 wrap-anywhere first:mt-0 last:mb-0",
        className,
      )}
      role={role}
    >
      {children}
    </aside>
  );
}
