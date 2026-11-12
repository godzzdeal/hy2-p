import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "@/components/ui/fields/Field";
import { FieldInfo } from "@/components/ui/fields/information";
import { Button } from "@/components/ui/button/Button";
import { RotateCcw } from "@/components/elements/icons";
import { FIELD_COPY } from "@/config/hysteria/structured/field-copy";
import { FIELD_DEFAULTS } from "@/config/hysteria/structured/schema/documentation/defaults";
import { cn } from "@/utils/cn";

interface IConfigProperty extends ComponentProps<"div"> {
  path: string;
  htmlFor?: string;
  labelId?: string;
  hint?: string;
  disabledReason?: string;
  canReset?: boolean;
  onReset?: () => void;
}

export function ConfigProperty({
  path,
  htmlFor,
  labelId,
  hint,
  disabledReason,
  canReset = false,
  onReset,
  className,
  children,
  ...props
}: IConfigProperty) {
  const { t } = useTranslation();
  const Label = htmlFor ? Field : "span";
  return (
    <div
      {...props}
      className={cn(
        "config-property flex items-center justify-between gap-1 min-h-control pl-2 border-l-4 border-accent bg-surface-soft",
        className,
      )}
    >
      <Label
        htmlFor={htmlFor}
        id={labelId}
        className="m-0 min-w-0 flex-1 text-xl font-bold text-accent wrap-anywhere"
      >
        {path}
      </Label>
      {children}
      <FieldInfo label={path}>
        {disabledReason && <p className="text-accent">{t(disabledReason)}</p>}
        <p>{t(FIELD_COPY[path]?.hint ?? hint ?? path)}</p>
        {FIELD_DEFAULTS[path] !== undefined && (
          <p className="text-muted">
            {t("По умолчанию: {{value}}", { value: String(FIELD_DEFAULTS[path]) })}
          </p>
        )}
      </FieldInfo>
      {onReset && (
        <Button
          type="button"
          className="field-reset w-control min-w-control p-1 disabled:hidden"
          disabled={!canReset}
          aria-label={t("Сбросить {{field}}", { field: path })}
          title={t("Вернуть значение по умолчанию")}
          onClick={onReset}
        >
          <RotateCcw width={24} height={24} aria-hidden />
        </Button>
      )}
    </div>
  );
}
