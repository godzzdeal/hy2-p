import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { type TChart } from "@/store/overview";
import { useTranslation } from "react-i18next";
interface IChartChoice {
  value: TChart;
  label: string;
  isChecked: boolean;
  onToggle: (value: TChart) => void;
}
export function ChartChoice({ value, label, isChecked, onToggle }: IChartChoice) {
  const { t } = useTranslation();
  return (
    <Field isInline className="m-0 p-2">
      <Input type="checkbox" checked={isChecked} onChange={() => onToggle(value)} />
      <span>{t(label)}</span>
    </Field>
  );
}
