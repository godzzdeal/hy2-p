import { Loader } from "@/components/ui/loading/Loader";
import { EmptyState } from "@/components/ui/status/EmptyState";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";

interface IQueryState extends Pick<ComponentProps<"div">, "className"> {
  isLoading: boolean;
  error?: Error | null;
}

export function QueryState({ isLoading, error, className }: IQueryState) {
  const { t } = useTranslation();
  if (isLoading) return <Loader className={className} />;
  if (error) return <EmptyState className={className}>{t("Не удалось загрузить данные.")}</EmptyState>;
  return null;
}
