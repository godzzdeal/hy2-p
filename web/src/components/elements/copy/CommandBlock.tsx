import { CopyButton } from "@/components/elements/copy/CopyButton";
import { useTranslation } from "react-i18next";

interface ICommandBlock {
  command: string;
  label?: string;
  copyLabel?: string;
}

export function CommandBlock({ command, label, copyLabel }: ICommandBlock) {
  const { t } = useTranslation();
  return (
    <div className="command-block" role="group" aria-label={label ?? t("Команда для сервера")}>
      <pre>
        <code tabIndex={0}>{command}</code>
      </pre>
      <CopyButton
        value={command}
        label={copyLabel ?? t("Скопировать команду")}
        title={command}
        fallback="Выделите команду и скопируйте вручную"
        isIconOnly
      />
    </div>
  );
}
