import { Spinner } from "@/components/ui/loading/Spinner";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";

interface ILoader extends Omit<ComponentProps<"span">, "children"> {
  label?: string;
  isInline?: boolean;
}

export function Loader({ label = "Загрузка…", isInline, className, ...props }: ILoader) {
  const { t } = useTranslation();
  return (
    <span
      role="status"
      aria-live="polite"
      {...props}
      className={cn("loader", { "loader-inline": isInline }, className)}
    >
      <Spinner width={isInline ? 24 : 32} height={isInline ? 24 : 32} />
      <span>{t(label)}</span>
    </span>
  );
}
