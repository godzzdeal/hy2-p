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
    <label className="checkbox">
      <input type="checkbox" checked={isChecked} onChange={() => onToggle(value)} />
      <span>{t(label)}</span>
    </label>
  );
}
