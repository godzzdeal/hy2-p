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
    <div
      className="command-block grid min-w-0 grid-cols-action items-center gap-2 border-2 border-command-line bg-command px-2 py-1 text-command-text"
      role="group"
      aria-label={label ?? t("Команда для сервера")}
    >
      <pre className="m-0 min-w-0 whitespace-pre-wrap wrap-anywhere">
        <code className="block select-all font-mono text-sm leading-snug" tabIndex={0}>
          {command}
        </code>
      </pre>
      <CopyButton
        className="border-command-line bg-transparent text-command-text shadow-none hover:bg-command-line hover:text-command-text"
        value={command}
        label={copyLabel ?? t("Скопировать команду")}
        title={command}
        fallback="Выделите команду и скопируйте вручную"
        isIconOnly
      />
    </div>
  );
}
