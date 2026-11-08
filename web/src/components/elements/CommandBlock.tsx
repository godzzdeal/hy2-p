import { Check, Copy } from "@/components/elements/icons";
import { copyValue } from "@/utils/clipboard";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "@/store/ui-store";
export function CommandBlock({
  command,
  label,
  copyLabel,
}: {
  command: string;
  label?: string;
  copyLabel?: string;
}) {
  const { t } = useTranslation();
  const [isCopied, setCopied] = useState(false);
  const notify = useUiStore((state) => state.notify);
  const Icon = isCopied ? Check : Copy;
  async function onCopy() {
    try {
      await copyValue(command);
      setCopied(true);
      notify("Скопировано");
    } catch {
      setCopied(false);
      notify("Выделите команду и скопируйте вручную");
    }
  }
  return (
    <div className="command-block" role="group" aria-label={label ?? t("Команда для сервера")}>
      <pre>
        <code tabIndex={0}>{command}</code>
      </pre>
      <button
        type="button"
        className="icon-btn secondary"
        title={command}
        aria-label={copyLabel ?? t("Скопировать команду")}
        onClick={() => void onCopy()}
      >
        <Icon width={24} height={24} aria-hidden />
      </button>
    </div>
  );
}
