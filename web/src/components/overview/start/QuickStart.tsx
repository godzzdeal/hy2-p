import { Card, CardHeader } from "@/components/ui/cards";
import { START_STEPS } from "@/components/overview/start/start-steps";
import { StartStep } from "@/components/overview/start/StartStep";
import { type TPage } from "@/config/navigation";
import { useTranslation } from "react-i18next";
export function QuickStart({ onSelect }: { onSelect: (page: TPage) => void }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <h2>{t("Быстрый старт")}</h2>
      </CardHeader>
      <div className="steps space-y-1 p-2">
        {START_STEPS.map((step) => (
          <StartStep key={step.page} step={step} onSelect={onSelect} />
        ))}
      </div>
    </Card>
  );
}
