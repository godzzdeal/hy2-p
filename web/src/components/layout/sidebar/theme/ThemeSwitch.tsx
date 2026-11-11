import { Button } from "@/components/ui/button/Button";
import { useThemeSwitch } from "./use-theme-switch";
import { useTranslation } from "react-i18next";
export function ThemeSwitch() {
  const { t } = useTranslation();
  const { current, next, onSwitchTheme } = useThemeSwitch();
  const Icon = current.icon;
  return (
    <Button
      type="button"
      size="icon"
      className="theme-control"
      aria-label={t("Тема")}
      title={`${t(current.label)} → ${t(next.label)}`}
      data-theme-mode={current.value}
      onClick={onSwitchTheme}
    >
      <Icon width={24} height={24} aria-hidden />
    </Button>
  );
}
