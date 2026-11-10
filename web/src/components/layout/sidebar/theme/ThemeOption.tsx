import { Button } from "@/components/ui/button/Button";
import { type TThemeOption } from "@/components/layout/sidebar/theme/theme-options";
import { useTranslation } from "react-i18next";

interface IThemeOption {
  option: TThemeOption;
  isSelected: boolean;
  onSelect: (value: TThemeOption["value"]) => void;
}

export function ThemeOption({ option, isSelected, onSelect }: IThemeOption) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      className="w-full border-line p-1 aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-text"
      aria-label={t(option.label)}
      title={t(option.label)}
      aria-pressed={isSelected}
      onClick={() => onSelect(option.value)}
    >
      <option.icon width={24} height={24} aria-hidden />
    </Button>
  );
}
