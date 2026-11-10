import { Button } from "@/components/ui/button/Button";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
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
    <Button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "h-auto justify-start px-2 py-1 text-left whitespace-normal max-desktop:h-control max-desktop:flex-none max-desktop:whitespace-nowrap",
        { selected: isSelected },
      )}
      onClick={() => onSelect(id)}
    >
      {t(title)}
    </Button>
  );
}
