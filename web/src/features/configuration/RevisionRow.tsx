import { useTranslation } from "react-i18next";
import { ChevronRight, History } from "lucide-react";
import { type IConfiguration, type IRevision } from "./model";
export function RevisionRow({
  revision,
  onRestore,
}: {
  revision: IRevision;
  onRestore: (value: IConfiguration) => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <button className="history-item" onClick={() => onRestore(revision.settings)}>
      <History size={20} aria-hidden />
      <span>
        {new Date(revision.created).toLocaleString(i18n.language)}
        <small>{t("Загрузить в редактор")}</small>
      </span>
      <ChevronRight size={16} aria-hidden />
    </button>
  );
}
