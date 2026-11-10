import { Spinner } from "@/components/ui/loading/Spinner";
import { cn } from "@/utils/cn";
import { Suspense, type ComponentProps } from "react";
import { Translation } from "react-i18next";

interface ILoader extends Omit<ComponentProps<"span">, "children"> {
  label?: string;
  isInline?: boolean;
}

export function Loader({ label = "Загрузка…", isInline, className, ...props }: ILoader) {
  return (
    <span
      role="status"
      aria-live="polite"
      {...props}
      className={cn(
        "loader flex items-center justify-center flex-col gap-3 min-h-32 p-6 text-muted text-center",
        { "loader-inline flex-row min-h-control p-2": isInline },
        className,
      )}
    >
      <Spinner width={isInline ? 24 : 32} height={isInline ? 24 : 32} />
      <Suspense fallback={<span>{label}</span>}>
        <Translation>{(t) => <span>{t(label)}</span>}</Translation>
      </Suspense>
    </span>
  );
}
