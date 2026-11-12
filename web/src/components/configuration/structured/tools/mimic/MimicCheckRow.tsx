import { Check, X } from "@/components/elements/icons";
import { cn } from "@/utils/cn";
import type { IMimicCheck } from "@/services/configuration/tools";
import { useTranslation } from "react-i18next";

export function MimicCheckRow({ check }: { check: IMimicCheck }) {
  const { t } = useTranslation();
  return (
    <li className="flex min-w-0 items-start gap-2 py-2" title={t(check.detail)}>
      {check.ok ? (
        <Check width={20} height={20} className="mt-1 shrink-0 text-accent" aria-hidden />
      ) : (
        <X width={20} height={20} className="mt-1 shrink-0 text-warning" aria-hidden />
      )}
      <span className={cn("min-w-0 text-lg wrap-anywhere", !check.ok && "text-warning")}>
        {t(check.detail)}
        <span className="sr-only">: {t(check.ok ? "Готово" : "Требуется")}</span>
      </span>
    </li>
  );
}
