import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
interface IBadge extends ComponentProps<"span"> {
  variant?: "neutral" | "success" | "accent" | "danger";
  isCounter?: boolean;
}
export function Badge({ className, variant = "neutral", isCounter = false, ...props }: IBadge) {
  return (
    <span
      {...props}
      className={cn(
        "badge inline-flex shrink-0 items-center justify-center gap-2 px-2 py-1 text-lg leading-none",
        {
          "bg-input text-muted": variant === "neutral",
          "bg-success-bg text-accent": variant === "success",
          "bg-surface-soft text-accent": variant === "accent",
          "bg-danger-bg text-danger": variant === "danger",
          "h-6 min-w-6 border-2 border-line py-0": isCounter,
        },
        className,
      )}
    />
  );
}
