import { Loader } from "@/components/ui/loading/Loader";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";

interface IQueryState extends Pick<ComponentProps<"div">, "className"> {
  isLoading: boolean;
  error?: Error | null;
}

export function QueryState({ isLoading, error, className }: IQueryState) {
  const { t } = useTranslation();
  if (isLoading) return <Loader className={className} />;
  if (error) return <p className={cn("empty", className)}>{t("Не удалось загрузить данные.")}</p>;
  return null;
}
