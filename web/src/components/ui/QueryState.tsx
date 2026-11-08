import { useTranslation } from "react-i18next";
interface IQueryState {
  isLoading: boolean;
  error?: Error | null;
}
export function QueryState({ isLoading, error }: IQueryState) {
  const { t } = useTranslation();
  if (isLoading)
    return (
      <p className="empty" role="status">
        {t("Загрузка\u2026")}
      </p>
    );
  if (error)
    return (
      <div className="alert" role="alert">
        {t(error.message)}
      </div>
    );
  return null;
}
