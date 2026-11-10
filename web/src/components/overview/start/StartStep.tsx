import { Button } from "@/components/ui/button/Button";
import { type START_STEPS } from "@/components/overview/start/start-steps";
import { type TPage } from "@/config/navigation";
import { useTranslation } from "react-i18next";
interface IStartStep {
  step: (typeof START_STEPS)[number];
  onSelect: (page: TPage) => void;
}
export function StartStep({ step, onSelect }: IStartStep) {
  const { t } = useTranslation();
  return (
    <Button
      className="step h-auto min-h-20 w-full justify-start gap-4 border-0 p-3 text-left whitespace-normal"
      onClick={() => onSelect(step.page)}
    >
      <span className="step-number grid size-10 shrink-0 place-items-center bg-surface-soft">
        {step.number}
      </span>
      <span className="min-w-0">
        <strong className="block">{t(step.title)}</strong>
        <small className="mt-1 block text-muted">{t(step.description)}</small>
      </span>
    </Button>
  );
}
