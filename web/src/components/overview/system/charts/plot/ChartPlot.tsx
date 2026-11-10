import {
  ChartAxis,
  chartLabels,
  chartTimes,
  type TChartUnit,
} from "@/components/overview/system/charts/axes";
import { ChartLine } from "@/components/overview/system/charts/plot/ChartLine";
import { CHART, chartGridPath } from "@/components/overview/system/charts/plot/chart-path";
import { useTranslation } from "react-i18next";
interface IChartPlot {
  title: string;
  primary: readonly number[];
  secondary: readonly number[];
  maximum: number;
  unit: TChartUnit;
  times: readonly number[];
}
const GRID_PATH = chartGridPath();
export function ChartPlot({ title, primary, secondary, maximum, unit, times }: IChartPlot) {
  const { t, i18n } = useTranslation();
  return (
    <div className="chart-plot grid grid-cols-label gap-x-2 gap-y-2 my-3">
      <ChartAxis labels={chartLabels(maximum, unit, t, i18n.language)} />
      <svg
        role="img"
        aria-label={t(title)}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        preserveAspectRatio="none"
      >
        <path
          className="chart-grid stroke-line"
          d={GRID_PATH}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <ChartLine values={primary} maximum={maximum} />
        <ChartLine values={secondary} maximum={maximum} isSecondary />
      </svg>
      <ChartAxis labels={chartTimes(times, i18n.language)} isHorizontal />
    </div>
  );
}
