import { Button } from "@/components/ui/button/Button";
import { ChevronRight, History } from "@/components/elements/icons";
import { type IConfiguration, type IRevision } from "@/services/configuration/configuration-types";
import { useTranslation } from "react-i18next";
export function RevisionRow({
  revision,
  onRestore,
}: {
  revision: IRevision;
  onRestore: (value: IConfiguration) => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <Button
      className="history-item flex w-full h-auto justify-start text-left gap-4 border-b border-line rounded-none"
      onClick={() => onRestore(revision.settings)}
    >
      <History width={24} height={24} aria-hidden />
      <span>
        {new Date(revision.created).toLocaleString(i18n.language)}
        <small>{t("Загрузить в редактор")}</small>
      </span>
      <ChevronRight width={24} height={24} aria-hidden />
    </Button>
  );
}
