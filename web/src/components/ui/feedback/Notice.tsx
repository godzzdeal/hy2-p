import { type ComponentProps } from "react";
import { cn } from "@/utils/cn";
import { TriangleAlert } from "@/components/elements/icons";
import { useTranslation } from "react-i18next";

interface INotice extends ComponentProps<"aside"> {
  variant?: "info" | "warning" | "danger";
}

export function Notice({
  children,
  className,
  variant = "info",
  role = "note",
  "aria-label": label,
  ...props
}: INotice) {
  const { t } = useTranslation();
  return (
    <aside
      {...props}
      className={cn(
        "notice flex min-w-0 items-start gap-3 border border-l-4 p-4 wrap-anywhere text-lg leading-snug text-pretty",
        variant === "info" && "border-line border-l-accent bg-surface-soft",
        variant === "warning" && "border-warning bg-warning-bg text-foreground",
        variant === "danger" && "border-danger bg-danger-bg text-danger",
        className,
      )}
      role={role}
      data-variant={variant}
      aria-label={
        label ?? (variant === "info" ? undefined : t(variant === "warning" ? "Предупреждение" : "Ошибка"))
      }
    >
      {variant !== "info" && (
        <TriangleAlert
          width={24}
          height={24}
          aria-hidden
          className={cn("mt-1 shrink-0", variant === "warning" ? "text-warning" : "text-danger")}
        />
      )}
      <div className="grid min-w-0 flex-1 gap-2">{children}</div>
    </aside>
  );
}
