import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "card-header max-tablet:p-4 flex min-w-0 flex-wrap items-center justify-between gap-4 border-b-2 border-line bg-surface-soft px-4 py-3",
        className,
      )}
    />
  );
}
