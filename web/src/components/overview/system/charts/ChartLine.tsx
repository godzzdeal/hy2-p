import { chartPoints } from "@/components/overview/system/charts/chart-path";
import { cn } from "@/utils/cn";

interface IChartLine {
  values: readonly number[];
  maximum: number;
  isSecondary?: boolean;
}

export function ChartLine({ values, maximum, isSecondary }: IChartLine) {
  if (!values.length) return null;
  return (
    <polyline
      className={cn("system-chart-line", { "system-chart-secondary": isSecondary })}
      points={chartPoints(values, maximum)}
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
  );
}
