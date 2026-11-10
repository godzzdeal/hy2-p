import { ThemeOption } from "@/components/layout/sidebar/theme/ThemeOption";
import { THEME_OPTIONS } from "@/components/layout/sidebar/theme/theme-options";
import { useUiStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";

export function ThemeSwitch() {
  const { t } = useTranslation();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  return (
    <div
      className="theme-control grid min-w-0 gap-2 my-4 text-lg max-tablet:my-0 tablet:group-data-collapsed/app:hidden"
      role="group"
      aria-label={t("Тема")}
    >
      <span>{t("Тема")}</span>
      <div className="grid grid-cols-3 gap-1">
        {THEME_OPTIONS.map((option) => (
          <ThemeOption
            key={option.value}
            option={option}
            isSelected={theme === option.value}
            onSelect={setTheme}
          />
        ))}
      </div>
    </div>
  );
}
