import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib";
export function ConfigTab({
  id,
  title,
  isSelected,
  onSelect,
}: {
  id: string;
  title: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn({ selected: isSelected })}
      onClick={() => onSelect(id)}
    >
      {t(title)}
    </button>
  );
}
