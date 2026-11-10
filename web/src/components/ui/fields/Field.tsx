import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

interface IField extends ComponentProps<"label"> {
  isInline?: boolean;
}

export function Field({ isInline = false, className, ...props }: IField) {
  return (
    <label
      {...props}
      className={cn(
        "min-w-0 gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-50",
        isInline ? "checkbox flex min-h-control cursor-pointer items-center" : "grid content-start",
        className,
      )}
    />
  );
}
