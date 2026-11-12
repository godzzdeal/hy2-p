import { CopyButton } from "@/components/elements/copy/CopyButton";
import { useTranslation } from "react-i18next";
import { Terminal } from "@/components/elements/icons";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/cn";
import { FieldInfo } from "@/components/ui/fields/information";

interface ICommandBlock extends Omit<ComponentProps<"div">, "children"> {
  command: string;
  label?: string;
  copyLabel?: string;
  description?: ReactNode;
}

export function CommandBlock({ command, label, copyLabel, description, className, ...props }: ICommandBlock) {
  const { t } = useTranslation();
  return (
    <div
      {...props}
      className={cn(
        "command-block grid min-w-0 grid-cols-toolbar items-start gap-3 border-2 border-command-line border-l-4 border-l-command-accent bg-command px-3 py-2 text-command-text shadow-pixel",
        className,
      )}
      role="group"
      aria-label={label ?? t("Команда для сервера")}
    >
      <span className="flex h-control items-center text-command-accent">
        <Terminal width={24} height={24} aria-hidden />
      </span>
      <pre className="m-0 min-w-0 py-1 whitespace-pre-wrap wrap-anywhere">
        <code className="block select-all font-sans text-lg leading-7" tabIndex={0}>
          {command}
        </code>
      </pre>
      <div className="flex items-start gap-1">
        {description && (
          <FieldInfo
            label={label ?? t("Команда для сервера")}
            aria-label={t("О команде {{command}}", { command: label ?? command })}
            className="text-command-text hover:bg-command-line hover:text-command-text"
          >
            {description}
          </FieldInfo>
        )}
        <CopyButton
          className="self-start border-command-line bg-transparent text-command-text shadow-none hover:bg-command-line hover:text-command-text"
          value={command}
          label={copyLabel ?? t("Скопировать команду")}
          title={command}
          fallback="Выделите команду и скопируйте вручную"
          isIconOnly
        />
      </div>
    </div>
  );
}
