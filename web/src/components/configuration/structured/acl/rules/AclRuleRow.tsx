import { Button } from "@/components/ui/button/Button";
import { Pencil } from "pixelarticons/react/Pencil.js";
import type { IAclRule } from "@/utils/configuration/structured/acl";
import { AclRuleMenu } from "./AclRuleMenu";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";

export interface IAclRuleRow {
  index: number;
  source: string;
  rule: IAclRule;
  total: number;
  isDisabled: boolean;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: number) => void;
}

export function AclRuleRow({ index, source, rule, onEdit, ...controls }: IAclRuleRow) {
  const { t } = useTranslation();
  const label = t("Изменить правило {{number}}", { number: index + 1 });
  return (
    <article
      className="grid min-w-0 gap-2 border-b border-line px-3 py-2 last:border-b-0"
      aria-label={t("Правило ACL {{number}}", { number: index + 1 })}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-base text-muted tabular-nums">#{index + 1}</span>
        <Button
          type="button"
          className="min-w-0 flex-1 shrink justify-start gap-2 h-auto px-0 py-1 text-left font-normal"
          disabled={controls.isDisabled}
          aria-label={label}
          title={label}
          onClick={() => onEdit(index)}
        >
          <code
            className={cn(
              "min-w-0 flex-1 font-sans text-lg wrap-anywhere",
              rule.mode === "rule" ? "text-accent" : "text-muted",
            )}
          >
            {source || t("Пустая строка")}
          </code>
          <Pencil width={20} height={20} className="shrink-0 text-muted" aria-hidden />
        </Button>
        <AclRuleMenu index={index} {...controls} />
      </div>
      {rule.mode === "text" && source.trim() && (
        <small className="text-warning">
          {t("Строка сохранена как текст. Проверьте синтаксис перед запуском.")}
        </small>
      )}
    </article>
  );
}
