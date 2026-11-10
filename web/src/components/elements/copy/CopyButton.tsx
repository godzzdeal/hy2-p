import { Button } from "@/components/ui/button/Button";
import { Check, Copy } from "@/components/elements/icons";
import { useCopy } from "@/components/elements/copy/use-copy";
import { useTranslation } from "react-i18next";
import { type ComponentProps } from "react";

interface ICopyButton extends Omit<ComponentProps<"button">, "value" | "children" | "onClick" | "type"> {
  value: string;
  label: string;
  fallback?: string;
  isIconOnly?: boolean;
  variant?: "primary" | "secondary";
}

export function CopyButton({
  value,
  label,
  fallback = "Скопируйте значение вручную",
  title,
  isIconOnly,
  variant = "secondary",
  className,
  disabled,
  ...props
}: ICopyButton) {
  const { t } = useTranslation();
  const copy = useCopy(value, fallback);
  const Icon = copy.isCopied ? Check : Copy;
  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      size={isIconOnly ? "icon" : "default"}
      className={className}
      aria-label={t(label)}
      title={title}
      disabled={disabled || copy.isPending || !value}
      onClick={copy.onCopy}
    >
      <Icon width={24} height={24} aria-hidden />
      {!isIconOnly && t(label)}
    </Button>
  );
}
