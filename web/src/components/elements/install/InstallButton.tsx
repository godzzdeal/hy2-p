import { Download } from "@/components/elements/icons";
import { useInstallStore } from "@/store/install-store";
import { useUiStore } from "@/store/ui-store";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
export function InstallButton({ onHelp, isCompact = false }: { onHelp: () => void; isCompact?: boolean }) {
  const { t } = useTranslation();
  const { prompt, isInstalled, setPrompt } = useInstallStore();
  const [isOpening, setOpening] = useState(false);
  const showError = useUiStore((state) => state.showError);
  async function onInstall() {
    if (!prompt) {
      onHelp();
      return;
    }
    setOpening(true);
    try {
      await prompt.prompt();
    } catch {
      showError(new Error(t("Не удалось открыть установку. Используйте меню браузера.")));
    } finally {
      setPrompt(null);
      setOpening(false);
    }
  }
  if (isInstalled) return isCompact ? null : <p role="status">{t("Панель уже установлена")}</p>;
  return (
    <button
      type="button"
      className={cn("install-button", isCompact ? "secondary" : "primary")}
      aria-label={t("Установить панель")}
      title={t("Установить панель")}
      disabled={isOpening}
      onClick={() => void onInstall()}
    >
      <Download width={24} height={24} aria-hidden />
      <span>{t(isOpening ? "Открываем…" : isCompact ? "Установить" : "Установить панель")}</span>
    </button>
  );
}
