import { CircleInfo } from "pixelarticons/react/CircleInfo.js";
import { Button } from "@/components/ui/button/Button";
import { Popover } from "@/components/ui/overlays/Popover";
import { FieldInfoContent } from "./FieldInfoContent";
import type { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

interface IFieldInfo extends Omit<ComponentProps<typeof Button>, "children"> {
  label: string;
  children: ReactNode;
}

export function FieldInfo({ label, children, className, "aria-label": ariaLabel, ...props }: IFieldInfo) {
  const { t } = useTranslation();
  const name = ariaLabel ?? t("Информация о поле {{field}}", { field: label });
  return (
    <Popover
      trigger={
        <Button
          {...props}
          type="button"
          size="icon"
          className={cn(
            "shrink-0 text-muted aria-expanded:bg-surface-soft aria-expanded:text-accent",
            className,
          )}
          aria-label={name}
          title={name}
        >
          <CircleInfo width={24} height={24} aria-hidden />
        </Button>
      }
      contentProps={{ className: "w-80", "aria-label": name }}
    >
      <FieldInfoContent label={label}>{children}</FieldInfoContent>
    </Popover>
  );
}
