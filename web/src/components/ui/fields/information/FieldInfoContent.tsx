import { Close } from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button/Button";
import { X } from "@/components/elements/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function FieldInfoContent({ label, children }: { label: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h2 className="min-w-0 self-center wrap-anywhere text-xl">{label}</h2>
        <Close asChild>
          <Button type="button" size="icon" aria-label={t("Закрыть подсказку")}>
            <X width={24} height={24} aria-hidden />
          </Button>
        </Close>
      </div>
      <div className="grid min-w-0 gap-3 wrap-anywhere text-lg leading-snug text-pretty">{children}</div>
    </div>
  );
}
