import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
interface IFieldGrid extends ComponentProps<"div"> {
  columns?: 2 | 3;
}
export function FieldGrid({ className, columns = 3, ...props }: IFieldGrid) {
  return (
    <div
      {...props}
      className={cn(
        "field-grid grid min-w-0 gap-3 p-4 max-compact:grid-cols-1",
        columns === 2 ? "grid-cols-2" : "grid-cols-3 max-desktop:grid-cols-2",
        className,
      )}
    />
  );
}
